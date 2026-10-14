# Phase 11 Performance Report

## 1. Dataset Size

The PostGIS dataset contains 17,023 spatial records. Search responses remain bounded at the existing maximum of 100 results.

## 2. Indexes

PostGIS uses city/category B-tree indexes, geometry GIST, and the new geography expression GIST index. MongoDB uses the existing unique OSM ID, city/category, and text indexes. User PostgreSQL uses existing user/place/history indexes and uniqueness constraints.

## 3. Spatial Query Performance

Measured with `EXPLAIN (ANALYZE, BUFFERS)`:

| Query | Plan | Execution |
|---|---|---:|
| Chennai radius, 5 km | Geography GIST Bitmap Index Scan after fix | 36.141 ms |
| Kanchipuram Temple, 5 km | City/category BitmapAnd | 1.848 ms |
| Chennai geometry nearest-neighbor | Geometry GIST Index Scan with `<->` | 5.714 ms |

The radius query previously used a sequential scan at 54.619 ms. The geography expression index reduced the measured execution to 36.141 ms.

## 4. MongoDB Performance

`Kamakshi` text search used the existing text index, examined 9 keys and 9 documents, returned 9 documents, and completed in 11 ms.

## 5. API Measurements

Measured against the isolated hardened backend on port 5004:

| Endpoint | Status | Time | Size |
|---|---:|---:|---:|
| `POST /api/auth/register` | 201 | 392.04 ms | measured response |
| `POST /api/auth/login` | 200 | 246.76 ms | measured response |
| `GET /api/places/search` | 200 | 81.73 ms | 23,878 bytes |
| `GET /api/places/:osm_id` | 200 | 9.24 ms | 533 bytes |
| `GET /api/users/me/favorites` | 200 | 3.83 ms | 39 bytes |
| `GET /api/users/me/search-history` | 200 | 3.71 ms | 39 bytes |
| `GET /api/places/:osm_id/reviews` | 200 | 3.52 ms | 39 bytes |

These are local single-request measurements, not production capacity benchmarks.

## 6. N+1 Analysis

Search uses batch MongoDB details, batch user interactions, and grouped rating summaries. Favorites and review history use batch PostGIS/MongoDB enrichment. No per-card place lookup was found in the Phase 10/11 paths.

## 7. Frontend and Map Performance

The frontend production build succeeds. The map renders only the bounded backend result set; it does not load all 17,023 records. The build reports the existing non-failing Leaflet main-chunk warning above 500 kB.

## 8. Optimizations Applied

- Added geography expression GIST index for meter-accurate `ST_DWithin`.
- Preserved geometry GIST nearest-neighbor support.
- Preserved bounded result limits.
- Kept batch place, interaction, and rating-summary queries.
- Added targeted API rate limits.

## 9. Pagination

Pagination was not added because the current backend enforces a maximum of 100 and the map/list intentionally represent one bounded result set. Larger result workflows can be added in a later phase without changing database ownership.
