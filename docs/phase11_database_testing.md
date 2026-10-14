# Phase 11 Database Testing

## PostGIS

Live indexes on `places_spatial`:

- `idx_places_spatial_geography` GIST expression index on `(geom::geography)`
- `idx_places_spatial_geom` GIST on `geom`
- `idx_places_spatial_city` B-tree on `city`
- `idx_places_spatial_category` B-tree on `category`
- `idx_places_spatial_osm_id` B-tree on `osm_id`

Measured plans:

- Radius search before geography expression index: sequential scan, 54.619 ms.
- Radius search after index: Bitmap Index Scan using `idx_places_spatial_geography`, 36.141 ms.
- Kanchipuram + Temple: BitmapAnd using city/category indexes, 1.848 ms.
- Geometry nearest-neighbor `<->`: Index Scan using `idx_places_spatial_geom`, 5.714 ms.

## MongoDB

The live `places` collection has indexes for `_id`, unique `osm_id`, category, city, city/category, and the existing text index `name_text_name_en_text_name_ta_text`.

Mongo text-search explain for `Kamakshi`:

- Execution time: 11 ms
- Returned: 9
- Keys examined: 9
- Documents examined: 9
- Winning index: `name_text_name_en_text_name_ta_text`

## User PostgreSQL

Existing unique and lookup indexes were verified for users, favorites, ratings, reviews, preferences, and search history. No duplicate indexes were added. User-scoped history, favorites, ratings, reviews, and preferences use parameterized queries and indexed user/place columns.

## Data Consistency

A live Kanchipuram Temple search verified OSM ID `5471058029` across the combined response. PostGIS supplied latitude `12.83444` and spatial identity; MongoDB supplied the place name `Varasakthi Vinayagar Temple`; User PostgreSQL supplied interaction data when authenticated.

## Result

All three databases connected successfully during the Phase 11 isolated backend run. No database schema recreation or source data modification was performed.
