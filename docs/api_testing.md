# GeoGuide API Testing

The tests below were executed against the local backend on `2026-09-26` using the existing databases, real OSM place `1157063806`, and demo user `1`.

## Health

`GET /health`

Expected status: `200`

Response confirms the backend process is running. Startup additionally verified all three database connections.

## Place Search

`GET /api/places/search?city=Kanchipuram&category=Temple&latitude=12.8390957&longitude=79.7051469&radius=5`

Expected status: `200`. Actual result: `100` PostGIS rows, ordered by distance, with MongoDB details merged. The first result was OSM ID `1157063806`.

Authenticated requests use `Authorization: Bearer <token>`. The backend derives the user from the token; frontend-supplied `userId` values are no longer accepted for user-specific operations.

## Single Place

`GET /api/places/1157063806`

Expected status: `200`. Actual result preserved OSM ID `1157063806`, returned spatial fields and MongoDB details, and included the user-interaction object.

## Ratings

`POST /api/places/1157063806/rating`

Header: `Authorization: Bearer <token>`

Body: `{ "rating": 5 }`

Expected status: `201`. Actual result: rating saved.

`GET /api/places/1157063806/ratings`

Expected status: `200`. Actual result: one rating returned.

## Reviews

`POST /api/places/1157063806/review`

Header: `Authorization: Bearer <token>`

Body: `{ "reviewText": "Integration API test review." }`

Expected status: `201`. Actual result: review saved.

`GET /api/places/1157063806/reviews`

Expected status: `200`. Actual result: one review returned.

## Favorites

`POST /api/places/1157063806/favorite`

Header: `Authorization: Bearer <token>`

Expected status: `201`. Actual result: favorite saved.

`GET /api/users/me/favorites`

Expected status: `200`. Actual result: two favorites returned after adding the test favorite.

`DELETE /api/places/1157063806/favorite`

Header: `Authorization: Bearer <token>`

Expected status: `200`. Actual result: `removed: true`.

## Search History

`GET /api/users/me/search-history`

Expected status: `200`. Actual result: four records returned after the user-scoped search tests.

## Error Cases

- Invalid latitude `95`: `400`.
- Nonexistent OSM ID `999999999999`: `404`.
- Missing, invalid, or expired bearer tokens on protected routes: `401`.
- Duplicate registration email: `409`.
- Account endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/profile`, and `PUT /api/auth/change-password`.
- Phase 11 hardening: Helmet headers, configured frontend-origin CORS, API/auth/search/interaction rate limits, and a maximum search limit of `100`.
- Invalid user IDs and place IDs are rejected before database writes.
- SQL queries use parameters; user input is not concatenated into SQL.