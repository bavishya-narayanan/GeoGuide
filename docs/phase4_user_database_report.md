# Phase 4 – PostgreSQL User & Interaction Database

## 1. Objective

Create a separate PostgreSQL database for users and interactions while preserving strict separation from the PostGIS and MongoDB place databases.

## 2. Database Name

`geoguide_users`

## 3. Database Architecture

The database stores user-owned records only. PostGIS answers where a place is, MongoDB answers what a place is, and this database answers who the user is and how they interact with that place.

## 4. Tables Created

- `users`
- `user_preferences`
- `ratings`
- `reviews`
- `favorites`
- `search_history`

## 5. Table Relationships

`users` has one-to-one preferences and one-to-many ratings, reviews, favorites, and search-history records. Each child table has a foreign key to `users.id` with `ON DELETE CASCADE`.

## 6. Primary Keys

`users.id`, `ratings.id`, `reviews.id`, `favorites.id`, and `search_history.id` are generated `BIGSERIAL` keys. `user_preferences.user_id` is its primary key because there is one preference record per user.

## 7. Foreign Keys

Only relationships within `geoguide_users` use PostgreSQL foreign keys. `place_osm_id` is deliberately not a foreign key because the place rows live in another PostgreSQL database and MongoDB.

## 8. Constraints

- User email is unique and nonblank.
- Password hashes are required and nonblank.
- Ratings are restricted to 1–5.
- One rating, review, or favorite is allowed per user/place pair.
- Reviews are trimmed to a nonempty maximum of 5,000 characters.
- Search queries are nonblank; coordinates and radius are range checked.

## 9. Indexes

Unique indexes cover email and user/place pairs. Additional indexes cover rating, review, and favorite place lookups, plus search-history user, timestamp, and user/timestamp queries. Redundant single-column user indexes were omitted where a compound unique index already starts with `user_id`.

## 10. Place ID Integration

The common integration key is `osm_id`. User tables store it as `place_osm_id BIGINT`, matching `places_spatial.osm_id` and MongoDB `places.osm_id`. Test IDs used were `243060332`, `247432808`, and `247677936`, sourced from the processed Phase 1 CSV. No place records were copied into this database.

## 11. CRUD Testing

Executed `database/users/test_queries.sql` successfully. It created two demo users, updated a user and preferences, deactivated the second user, created and updated a rating and review, added and removed a favorite, and inserted/retrieved three searches. It also executed representative user/place reads.

## 12. Validation Results

PostgreSQL 18.4 connection and schema loading succeeded. All six tables were created. The CRUD run ended with 2 users, 1 preference row, 1 rating, 1 review, 1 favorite, and 3 search-history rows. The script rejected rating values 0 and 6, duplicate ratings, empty reviews, duplicate reviews, and duplicate favorites. The validation script additionally checks duplicate email, invalid user IDs, table/index/constraint existence, row counts, and orphan relationships.

## 13. Security Considerations

The schema stores `password_hash`, never plaintext passwords. Connection settings are environment-driven through `USER_DB_*`; no real password is committed. Authentication and password hashing are intentionally deferred to the backend phase.

## 14. Problems Encountered

No PostgreSQL availability problem was encountered. The existing MongoDB consistency script contains a legacy hardcoded `PGPASSWORD` fallback; it was not changed because it belongs to Phase 3, but it should be removed before production deployment.

## 15. Solutions

Created an isolated database and schema, used logical OSM references across database boundaries, selected a flexible `TEXT[]` preference representation, added targeted indexes and constraints, and provided reproducible SQL validation.

## 16. Phase 4 Completion Status

**Complete.** The user database, schema, CRUD checks, validation checks, connection module, and documentation are present. Phase 5 integration was not started.

## Recreate Commands

```powershell
psql -U postgres -d postgres -c "CREATE DATABASE geoguide_users;"
psql -U postgres -d geoguide_users -f database/users/schema.sql
psql -U postgres -d geoguide_users -f database/users/test_queries.sql
psql -U postgres -d geoguide_users -f database/users/validation.sql
```