# Phase 9 - Authentication & User Account System

## 1. Phase Objective

GeoGuide now supports backend-managed registration, login, JWT sessions, logout, profile updates, password changes, protected user routes, and authenticated place interactions while preserving the three-database architecture.

## 2. Existing Architecture Inspected

The existing `geoguide_users` schema already contained `users`, `user_preferences`, `ratings`, `reviews`, `favorites`, and `search_history`. The existing PostGIS, MongoDB, Express, React, Phase 8 search, and Phase 7 map flows were reused. No database, table, or spatial record was recreated.

## 3. Authentication Architecture

The backend issues JWT bearer tokens signed with `JWT_SECRET` and configured with `JWT_EXPIRES_IN`. `authMiddleware.js` verifies the token, loads the active user, and attaches the user to `request.user`. The frontend stores the token in local storage, attaches it centrally through Axios, refreshes `/api/auth/me`, and clears it on a 401 response.

Logout is stateless JWT logout: the frontend removes the token and user state. Existing tokens remain valid until expiry because no session or token-revocation table was added.

## 4. Database Changes

No database schema changes were required. Existing `password_hash` is reused. Password hashes are selected only by internal authentication queries and are never returned by public user responses.

## 5. Registration Flow

`POST /api/auth/register` validates name, email, and an 8-128 character password, checks email uniqueness, hashes the password with bcrypt, creates the user, and returns a safe user object plus JWT.

## 6. Login Flow

`POST /api/auth/login` normalizes the email, compares the supplied password using bcrypt, and returns a safe user object plus JWT. Invalid credentials return HTTP 401.

## 7. JWT Flow

The frontend sends `Authorization: Bearer <token>` through one Axios interceptor. Protected backend routes reject missing, malformed, invalid, or expired tokens with HTTP 401.

## 8. Authentication Middleware

`requireAuth` protects account and mutation routes. `optionalAuth` supports public search and place details while attaching user interactions when a valid token is supplied.

## 9. Protected APIs

- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `GET /api/users/me/favorites`
- `GET /api/users/me/search-history`
- `GET /api/users/me/ratings`
- `GET /api/users/me/reviews`
- Authenticated favorite, rating, and review mutations under `/api/places/:osmId`

User identity is always derived from the JWT. Frontend-supplied user IDs are not used for authenticated mutations or user-scoped reads.

## 10. Frontend Authentication

Added `/login`, `/register`, and protected `/profile`, `/favorites`, and `/history` routes. The existing Navbar now displays login/logout state. ProtectedRoute redirects unauthenticated users to `/login`.

## 11. Favorites Integration

Favorite operations now require authentication and use the existing favorites table. Logged-out mutations receive 401 rather than creating anonymous records.

## 12. Reviews/Ratings Integration

Rating and review writes require authentication and use existing unique user/place constraints. Public read endpoints remain available. The frontend uses the authenticated interaction object for current-user state.

## 13. Search-History Integration

Authenticated searches continue to write to the existing `search_history` table. History is read only through `/api/users/me/search-history`; arbitrary user history routes were removed from the active API surface.

## 14. Security Measures

- bcrypt password hashing with 12 rounds
- JWT secret and expiry from environment variables
- no hardcoded repository secret
- `.env` ignored by Git
- parameterized PostgreSQL queries
- safe public user serialization
- protected user operations
- 400/401/404/409/500 error handling
- no frontend database credentials or database connections

## 15. API Testing Results

Live tests ran against isolated backend port 5002 with PostgreSQL, PostGIS, MongoDB, and user PostgreSQL connected:

- Registration: passed; response contained no password fields.
- Duplicate email: HTTP 409.
- Incorrect login: HTTP 401.
- Missing `/api/auth/me`: HTTP 401.
- Invalid JWT: HTTP 401.
- Profile update: passed.
- Incorrect current password: HTTP 401.
- Password change: passed.
- Authenticated search: passed.
- Own search history: passed.
- Favorite add/remove: passed.
- Authenticated rating/review writes: passed.
- Own rating/review reads: passed.
- Unauthenticated favorite/rating/review writes: HTTP 401.
- Temporary validation user and cascaded test records were removed after testing.

## 16. Screenshots/Placeholders

No screenshot artifact was committed. The frontend build and browser routes were validated through the local development environment; interactive browser capture can be added later if required for presentation materials.

## 17. Known Limitations

Logout is client-side token removal without server-side JWT revocation. Email changes and email verification are intentionally unsupported. Aggregate ratings were not added because the existing API exposes individual ratings only. Authentication tests used a temporary process-only JWT secret and did not alter the repository `.env` file.

## 18. Phase Completion Status

Phase 9 authentication implementation is complete and the backend, frontend, database connectivity, protected APIs, and authenticated interaction flows have been validated. Existing search, map, MongoDB detail, PostGIS, and user-database architecture remains intact. Phase 10 was not started.
