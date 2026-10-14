# Phase 7A - Location-Aware Search Foundation

## 1. Objective

GeoGuide now sends an explicit search center to the existing Express search endpoint. The frontend supports current location and predefined city searches, while keeping map selection ready for Phase 7B.

## 2. Location Modes

- **Current:** browser geolocation, stored in React state as `{ latitude, longitude, source: "current", label: "My Location" }`.
- **City:** Chennai, Kanchipuram, and Madurai use the existing representative coordinates in `SearchFilters.jsx` and are labeled `Searching around {city}`.
- **Manual:** the location shape is supported with `source: "manual"`; the visible `Select Location` control remains disabled until Phase 7B map interaction exists.

## 3. Browser Geolocation

`navigator.geolocation.getCurrentPosition` runs only after the user presses `Use My Location`. The UI reports requesting, success, permission-denied, and unavailable/timeout states. Precise coordinates are not written to localStorage or the URL.

## 4. Search Coordinate Flow

The flow remains React -> `GET /api/places/search` -> PostGIS -> MongoDB enrichment -> optional user PostgreSQL interactions/history -> React. Current-location searches omit the city filter; city searches send both the city filter and its representative center.

## 5. PostGIS Distance Calculation

`spatialService.searchNearbyPlaces` continues to use `ST_DWithin` for radius filtering and `ST_Distance` for `distance_meters`. The frontend only formats the returned value for display.

## 6. City Search

City coordinates reuse the existing values already used by Phase 6:

- Chennai: `13.0827, 80.2707`
- Kanchipuram: `12.8342, 79.7036`
- Madurai: `9.9252, 78.1198`

The UI explicitly says `Searching around {city}` rather than implying the user's GPS location.

## 7. Manual Location Preparation

The search state has the required `{ latitude, longitude, source, label }` shape. No Leaflet, OpenStreetMap tiles, marker, reverse-geocoding, or map-click code was added.

## 8. Unnamed Place Handling

No SQL or MongoDB query filters on `name`. Spatial rows remain the source of the result list even when MongoDB has no enrichment document. The API preserves `name: null` and adds a presentation-only `display_name`, for example `Unnamed Temple` or `Unnamed Place`. Coordinates and PostGIS distance are preserved.

## 9. API Changes

Search responses now include `display_name`, top-level `latitude`, and top-level `longitude` in addition to the existing nested `location` object. Existing request parameters and endpoint remain unchanged. Backend validation continues to require valid latitude/longitude and positive radius, with an additional 80-character bound on city/category filters. Queries remain parameterized.

## 10. Testing

Automated checks run:

- `node --check backend/src/services/spatialService.js`
- `node --check backend/src/services/searchService.js`
- focused `mergePlace` check for an unnamed Temple, including name preservation, display name, coordinates, and distance
- `npm run build` in `frontend/`

The full database-backed and browser-permission matrix requires running PostgreSQL/PostGIS, MongoDB, the backend, and a browser with a controlled geolocation permission. Those services were not available in this execution environment, so those tests are not claimed as executed.

## 11. Actual Test Results

- Backend syntax checks: passed.
- Unnamed-place normalization check: passed (`name` remained `null`; `display_name` was `Unnamed Temple`; distance and coordinates remained present).
- Frontend production build: passed.
- API result counts, PostGIS distance comparison, and the 15 database/browser scenarios: not run because the required services/browser harness were unavailable.

## 12. Problems Encountered

The existing frontend selected a city coordinate implicitly for every search and did not expose a current-location action. The API had no normalized display name for null OSM names.

## 13. Solutions

Added explicit location state and controls to the search results page, routed current coordinates through the existing API, preserved city mode, and normalized display names at the API/presentation boundary without changing source data or schemas.

## 14. Phase 7A Completion Status

Implementation is complete for the code paths available in this workspace. Database-backed verification remains pending until the three databases and a browser test session are running. Phase 7B was not started.
