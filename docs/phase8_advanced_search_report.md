# Phase 8 - Advanced Search & Discovery

## 1. Objective

GeoGuide now supports richer spatial discovery through the existing React -> Express -> PostGIS/MongoDB/User PostgreSQL architecture. No new database or schema was introduced.

## 2. Features Implemented

- Nearby searches with category, city, radius, and result limit
- Nearest, farthest, and name sorting
- MongoDB text-index name search combined with PostGIS spatial filtering
- Search This Area through the existing map selection flow
- Actual result counts and a maximum result limit of 100
- Clickable search-history restoration
- Preference-based category discovery on the home page
- Existing favorite integration retained
- Real current-user review indicators retained
- Existing unnamed-place normalization retained

## 3. Search Architecture

`GET /api/places/search` remains the unified endpoint. MongoDB text search first produces candidate `osm_id` values for a non-empty name query. PostGIS then applies radius, city, category, candidate-ID, ordering, and limit constraints. MongoDB details and User PostgreSQL interactions are merged afterward. React never connects directly to a database.

## 4. Nearby Search

The existing `ST_DWithin` query remains authoritative for radius filtering and `ST_Distance` remains authoritative for returned distances. The frontend displays the returned value without recalculating it.

## 5. Nearest Search

`sort=distance` orders by PostGIS distance ascending. `sort=distance_desc` supports farthest first. The existing spatial index and `places_spatial` table are reused.

## 6. Category Filtering

The actual dataset contains 37 categories, including Temple, Restaurant, Hospital, Cafe, ATM, Bank, Park, Shop, School, Hotel, Transport, and others. The existing frontend category list matches these values; no invented category values were added.

## 7. City Filtering

Chennai, Kanchipuram, and Madurai continue to combine with category, radius, query, and sort filters.

## 8. Name Search

MongoDB's existing text index on `name`, `name_en`, and `name_ta` is used through `$text`. Candidate IDs are passed to parameterized PostGIS SQL so name search does not bypass spatial filtering.

## 9. Radius Filtering

The backend validates positive radius values up to 50 km. The existing map radius and API radius continue to use the same kilometer value.

## 10. Sorting

Supported values are `distance`, `distance_desc`, and `name`. Invalid sort values return HTTP 400. Name sorting uses PostGIS `name ASC NULLS LAST` after spatial filtering.

## 11. Search This Area

The Phase 7 map-click selection now exposes `Search This Area`. It reuses the current query, category, radius, and sort settings and submits the selected coordinates through the existing search endpoint.

## 12. Favorites Integration

Existing POST and DELETE favorite endpoints remain in use. Search results continue to show and update favorite state through User PostgreSQL.

## 13. Ratings Integration

Existing per-user ratings remain visible. No aggregate rating was invented because the current API does not provide aggregate ratings.

## 14. Search History

Meaningful searches continue to be saved only when a valid user ID is supplied. The History page now renders each saved search as a restorable button that rebuilds its query, city, category, radius, and sort parameters.

## 15. Preference-Based Discovery

When the existing profile endpoint returns `preferred_categories`, the home page shows a `Based on your preferences` section. Selecting a category preserves the current city and radius and launches the normal search flow. No machine learning or AI recommendation was added.

## 16. Unnamed Place Handling

Unnamed records remain in PostGIS results. The API preserves `name: null` and returns `display_name`, such as `Unnamed ATM`, while retaining coordinates and distance.

## 17. Performance

PostGIS filters before MongoDB enrichment. The response limit is validated and capped at 100, preventing the full 17,023-record dataset from reaching React or the map. Pagination/load-more was not added because the existing bounded result set and map synchronization use one predictable result page.

## 18. Testing

Automated checks:

- Backend syntax checks for changed services/routes
- Backend validation checks for valid and invalid sort/limit values
- Frontend production builds
- Workspace diagnostics for changed frontend files
- Live API checks against the configured PostgreSQL, PostGIS, MongoDB, and user PostgreSQL services
- Browser checks against the updated frontend/backend

## 19. Actual Test Results

- Nearby Chennai Restaurant, 3 km, limit 20: 20 results; first PostGIS distance was 201.20658189 meters.
- Nearest Chennai Hospital, 10 km, limit 10: 10 results; first two distances were in ascending order.
- Mongo name search `Kamakshi` around Kanchipuram: 4 API results at 10 km; browser query with Temple and 5 km returned 3 cards and 3 markers.
- Kanchipuram + Temple + name sort: 20 results; first category was Temple and names were ordered ascending.
- Unnamed-place test: returned a real record with `name: null` and `display_name: Unnamed ATM`.
- Invalid sort: HTTP 400.
- User-aware search with active user `1`: returned 1 result, persisted history, and increased history count to 6.
- Favorite add/remove test: both succeeded and removal cleanup succeeded.
- Browser Name A-Z test: `Adi Kamakshi`, `Kamakshi Amman Temple`, `Kamakshi Pandal`.
- Browser Search This Area test: selected marker and control appeared; submitting refreshed the result set.
- Existing Phase 7 map/list synchronization remained intact.

## 20. Problems Encountered

The original search query had no name parameter, sort control, or limit validation. Search history was display-only and could not restore a previous search. The frontend had no preference-based discovery section.

## 21. Solutions

Extended the existing search service and route, reused MongoDB's existing text index, kept spatial filtering in PostGIS, added validated sort/limit parameters, made history rows navigable, and added preference-driven category links without changing database schemas.

## 22. Phase 8 Completion Status

Phase 8 implementation and the available live API/browser verification are complete. Aggregate ratings, browser-controlled geolocation permission, and full 20-case manual matrix coverage were not claimed because aggregate rating data and a controllable geolocation permission harness are not available in this environment. Phase 9 was not started.
