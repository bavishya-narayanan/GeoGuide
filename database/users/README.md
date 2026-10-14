# GeoGuide PostgreSQL User Database

## Purpose

`geoguide_users` is the third GeoGuide database component. It stores who the user is and how the user interacts with places. It does not duplicate spatial records from `geoguide_spatial` or place details from MongoDB.

PostGIS is not installed or required in this database.

## Tables

- `users`: user identity, password hash, lifecycle status, and timestamps.
- `user_preferences`: one preference row per user; categories use a `TEXT[]` so new Phase 1/3 categories do not require a schema change.
- `ratings`: one rating from a user for a place, constrained to 1 through 5.
- `reviews`: one active review from a user for a place, limited to 5,000 characters.
- `favorites`: saved places with duplicate protection.
- `search_history`: search parameters, with optional coordinate and radius fields.

All interaction tables use `user_id` foreign keys to `users.id` with cascading deletes.

## Place Integration

`place_osm_id BIGINT` is the shared logical identifier for `places_spatial.osm_id` and MongoDB `places.osm_id`. No cross-database foreign key is created because PostgreSQL cannot enforce a foreign key into another database or MongoDB. The application should resolve the ID through the spatial and place databases when it needs full place data.

The demo scripts use real IDs from `dataset/processed/geoguide_pois.csv`: `243060332`, `247432808`, and `247677936`.

## Setup

Set the PostgreSQL password through the shell or a local, ignored `.env` file. The repository template is `.env.example`.

```powershell
psql -U postgres -d postgres -c "CREATE DATABASE geoguide_users;"
psql -U postgres -d geoguide_users -f database/users/schema.sql
```

If the database already exists, skip the `CREATE DATABASE` command. The schema is safe to rerun with `IF NOT EXISTS`.

## CRUD and Validation

The demo script resets the six user tables, creates clearly marked demo users, exercises CRUD operations, and checks expected failures:

```powershell
psql -U postgres -d geoguide_users -f database/users/test_queries.sql
psql -U postgres -d geoguide_users -f database/users/validation.sql
```

The validation script reports tables, indexes, constraints, row counts, orphan checks, duplicate-email rejection, and invalid-user rejection. Do not run `test_queries.sql` against production data because it begins with `TRUNCATE`.

## Indexes

Unique constraints index email and each user/place pair. Additional indexes support lookups by `place_osm_id`, recent searches, and user-scoped search history. The compound unique indexes already support user-plus-place reads, so redundant single-column user indexes are not created.

## Example Queries

```sql
SELECT * FROM favorites WHERE user_id = 1;
SELECT * FROM ratings WHERE place_osm_id = 243060332;
SELECT * FROM reviews WHERE place_osm_id = 243060332;
SELECT * FROM search_history WHERE user_id = 1 ORDER BY searched_at DESC LIMIT 10;
```

## Node.js Connection

`connection.js` exports a `pg.Pool` configured from `USER_DB_HOST`, `USER_DB_PORT`, `USER_DB_NAME`, `USER_DB_USER`, and `USER_DB_PASSWORD`. It contains no password fallback. Authentication, hashing, routes, and controllers are outside Phase 4.

## Security

Only password hashes belong in `users.password_hash`; plaintext passwords must never be stored. Keep `.env` files out of version control, use a least-privilege database role outside local setup, and rotate credentials through the deployment environment.