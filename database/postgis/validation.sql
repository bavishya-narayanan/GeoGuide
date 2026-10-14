-- Validation script
SELECT 'Total Records' AS metric, COUNT(*)::text AS value FROM places_spatial
UNION ALL
SELECT 'Records missing Geometry', COUNT(*)::text FROM places_spatial WHERE geom IS NULL
UNION ALL
SELECT 'Duplicate OSM IDs', COUNT(*)::text FROM (SELECT osm_id FROM places_spatial GROUP BY osm_id HAVING COUNT(*) > 1) sub
UNION ALL
SELECT 'Chennai Records', COUNT(*)::text FROM places_spatial WHERE city = 'Chennai'
UNION ALL
SELECT 'Madurai Records', COUNT(*)::text FROM places_spatial WHERE city = 'Madurai'
UNION ALL
SELECT 'Kanchipuram Records', COUNT(*)::text FROM places_spatial WHERE city = 'Kanchipuram';

-- Bounding box check by city (returns the min/max coordinates using PostGIS box2d)
SELECT city, ST_Extent(geom) AS bounding_box FROM places_spatial GROUP BY city;
