# GeoGuide Phase 2 - Spatial Database (PostgreSQL + PostGIS)

This directory contains the database schema, import scripts, and spatial queries for setting up the GeoGuide PostgreSQL spatial database. 

## 1. Database Configuration
* **Database Name**: `geoguide_spatial`
* **Extensions**: `postgis` (provides geometry types and spatial functions)
* **Tables**: `places_spatial`
* **Spatial Column**: `geom` of type `GEOMETRY(Point, 4326)`
* **Coordinate System (SRID)**: `4326` (WGS 84 - Standard latitude/longitude) - Chosen because raw OSM data uses standard WGS 84 coordinates.

## 2. Table Structure (`places_spatial`)
The `places_spatial` table holds all POI records along with their geometry for spatial querying:
* `id` (SERIAL PRIMARY KEY)
* `osm_id` (BIGINT) - Source OpenStreetMap ID
* `osm_type` (VARCHAR) - node, way, relation
* `city` (VARCHAR)
* `category` (VARCHAR) - Core GeoGuide category
* `name`, `name_en`, `name_ta` (TEXT)
* `lat`, `lon` (NUMERIC)
* `amenity`, `tourism`, `shop`, `leisure`, `historic`, `healthcare`, `railway`, `aeroway`, `religion` (VARCHAR)
* `operator`, `opening_hours`, `phone`, `website`, `addr_street`, `addr_city` (TEXT/VARCHAR)
* `geom` (GEOMETRY(Point, 4326))

## 3. Indexes
Indexes created to optimize search and spatial queries:
* `idx_places_spatial_geom` (`GIST` index on `geom`): Critical for fast spatial bounding box and distance lookups using PostGIS.
* `idx_places_spatial_city` (B-Tree on `city`): Accelerates city-level filtering.
* `idx_places_spatial_category` (B-Tree on `category`): Fast category lookups.
* `idx_places_spatial_osm_id` (B-Tree on `osm_id`): For fast point lookups by OSM ID.

## 4. Views
* `city_place_summary`: Aggregates the number of POIs per category per city.
* `category_summary`: Global count of POIs per category.

## 5. Dataset Summary
Data was imported from `dataset/processed/geoguide_pois.csv`.
* **Total Records**: 17,023
* **Records per City**:
  * Chennai: 14,447
  * Madurai: 1,679
  * Kanchipuram: 897
* **Top Categories**: Shop (4,099), Temple (1,407), Clinic/Healthcare (1,289), Hospital (1,234), Restaurant (969), Park (898), Hotel (648).

## 6. Important Spatial Queries
Detailed in `spatial_queries.sql`, utilizing PostGIS functions:
* `ST_Distance(geom1, geom2)`: Calculates distance between two geometries in meters (when cast to `geography`).
* `ST_DWithin(geom1, geom2, distance)`: Fast boolean check if geometries are within a specified distance, using the GIST spatial index.
* `geom <-> point`: K-Nearest Neighbor (KNN) distance operator, which utilizes the spatial index to quickly find the absolute nearest points.

## 7. How to run
1. Open PowerShell/CMD.
2. Connect to PostgreSQL and create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE geoguide_spatial;"
   psql -U postgres -d geoguide_spatial -c "CREATE EXTENSION postgis;"
   ```
3. Load the schema and import the data:
   ```bash
   psql -U postgres -d geoguide_spatial -f database\schema.sql
   psql -U postgres -d geoguide_spatial -f database\import.sql
   ```
4. Run test queries:
   ```bash
   psql -U postgres -d geoguide_spatial -f database\spatial_queries.sql
   ```
