# Phase 5 – Three-Database Integration

## 1. Objective

Create the Node.js + Express backend integration layer for the existing PostGIS, MongoDB, and user PostgreSQL databases.

## 2. Existing Project Structure

The existing `database/postgis/`, `database/mongodb/`, and `database/users/` folders were reused. A single new `backend/` folder was added. No existing database tables or datasets were duplicated or renamed.

## 3. Database Architecture

- PostGIS `geoguide_spatial`: spatial filtering, coordinates, categories, cities, and distance.
- MongoDB `geoguide_places`: place details from the existing `Place` model.
- PostgreSQL `geoguide_users`: users and interactions.

The shared logical identifier is `osm_id` / `place_osm_id`.

## 4. Backend Architecture

The backend contains separate connection modules, spatial/place/user services, a search merge service, Express routes, and centralized error handling. Search is filtered in PostGIS first, then matching IDs are used for MongoDB and optional user lookups.

## 5. Database Connections

Startup was executed successfully with runtime environment variables:

```text
Spatial PostgreSQL: Connected
MongoDB: Connected
User PostgreSQL: Connected
Server running on port 5000
```

Credentials are read from environment variables and are not stored in source code.

## 6. Search Workflow

Requests are validated, PostGIS executes `ST_DWithin` and `ST_Distance`, no more than 100 matching OSM IDs are sent to MongoDB, and optional user interactions are merged into the response. A valid user search is recorded in `search_history`.

## 7. PostGIS Integration

`spatialService.js` uses the existing `places_spatial` table and `geom` column with SRID 4326. It supports city, category, latitude, longitude, radius, and nearest-by-distance ordering without modifying the Phase 2 schema.

## 8. MongoDB Integration

`placeService.js` reuses the existing Phase 3 `Place` model and queries only `{ osm_id: { $in: [...] } }` or one OSM ID. The backend was corrected to connect the same Mongoose instance used by that existing model.

## 9. User PostgreSQL Integration

`userService.js` uses the existing `users`, `ratings`, `reviews`, `favorites`, and `search_history` tables. It supports interaction reads and rating, review, favorite, and search-history writes without creating tables.

## 10. API Endpoints

- `GET /health`
- `GET /api/places/search`
- `GET /api/places/:osmId`
- `POST/GET /api/places/:osmId/rating(s)`
- `POST/GET /api/places/:osmId/review(s)`
- `POST/DELETE /api/places/:osmId/favorite`
- `GET /api/users/:userId/favorites`
- `GET /api/users/:userId/search-history`

## 11. Test Cases

Executed with real data: Kanchipuram temple search, single-place lookup, user-scoped search, rating, review, favorite add/read/remove, search history, invalid latitude, and nonexistent place ID.

## 12. Actual Test Results

- Main search: HTTP `200`, `100` results.
- First tested OSM ID: `1157063806`.
- MongoDB details: present for the tested result set.
- Single place: HTTP `200`, OSM ID preserved.
- Rating save/read: successful, one rating returned.
- Review save/read: successful, one review returned.
- Favorite add/read/remove: successful; removal returned `true`.
- Search history: four records returned after user-scoped tests.
- Invalid latitude: HTTP `400`.
- Missing place: HTTP `404`.

## 13. Data Consistency

The tested OSM ID remained consistent from PostGIS through MongoDB and user interactions. No missing MongoDB detail was observed in the tested 100-result response. Full cross-database parity remains covered by the existing Phase 3 consistency tooling; this phase did not alter those databases.

## 14. Performance

PostGIS filters and limits results before MongoDB access. MongoDB uses the existing unique OSM ID index. User queries use existing interaction and search-history indexes. SQL is parameterized.

## 15. Error Handling

Invalid coordinates, radius, IDs, missing places, missing users, and database failures are handled through HTTP responses. Internal errors are logged server-side without returning credentials or stack traces.

## 16. Problems Encountered

The first valid API search returned a MongoDB buffering timeout because the existing Phase 3 model resolved a separate nested Mongoose dependency from the backend's Mongoose connection.

## 17. Solutions

The backend now connects through the existing model's Mongoose base, preserving the Phase 3 model and ensuring queries use the connected instance. The corrected integration passed the live API tests.

## 18. Phase 5 Completion Status

**Complete.** The three-database backend integration, live health checks, API tests, consistency validation, and documentation are complete. Phase 6 frontend work was not started.

## Start Command

From the repository root, configure `SPATIAL_DB_PASSWORD` and `USER_DB_PASSWORD` in a local ignored `.env`, then run:

```powershell
Push-Location backend
npm install
npm start
Pop-Location
```