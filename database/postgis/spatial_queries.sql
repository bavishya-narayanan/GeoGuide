-- 1. Find all places within a given radius (e.g., 1km) of a coordinate (e.g., 79.9, 12.8 - near Chennai)
SELECT name, category, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(79.9, 12.8), 4326)::geography) AS distance_m
FROM places_spatial
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(79.9, 12.8), 4326)::geography, 1000)
ORDER BY distance_m;

-- 2. Find the distance between two specific places (by osm_id or name)
SELECT p1.name AS place1, p2.name AS place2, 
       ST_Distance(p1.geom::geography, p2.geom::geography) AS distance_m
FROM places_spatial p1, places_spatial p2
WHERE p1.osm_id = 256777901 AND p2.osm_id = 261716103;

-- 3. Find the nearest place to a given coordinate (e.g., 79.7, 12.84 in Kanchipuram)
SELECT name, category, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(79.7, 12.84), 4326)::geography) AS distance_m
FROM places_spatial
ORDER BY geom <-> ST_SetSRID(ST_MakePoint(79.7, 12.84), 4326)
LIMIT 1;

-- 4. Find the nearest place of a specific category (e.g., 'Hospital')
SELECT name, category, city, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(78.1, 9.9), 4326)::geography) AS distance_m
FROM places_spatial
WHERE category = 'Hospital'
ORDER BY geom <-> ST_SetSRID(ST_MakePoint(78.1, 9.9), 4326)
LIMIT 1;

-- 5. Find all temples within 5 km of a location (Madurai center: 78.119, 9.925)
SELECT name, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(78.119, 9.925), 4326)::geography) AS distance_m
FROM places_spatial
WHERE category = 'Temple'
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(78.119, 9.925), 4326)::geography, 5000)
ORDER BY distance_m;

-- 6. Find all restaurants within 2 km of a location (Chennai center: 80.27, 13.08)
SELECT name, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(80.27, 13.08), 4326)::geography) AS distance_m
FROM places_spatial
WHERE category = 'Restaurant'
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(80.27, 13.08), 4326)::geography, 2000)
ORDER BY distance_m;

-- 7. Find hospitals within a specified radius (e.g., 3 km in Kanchipuram: 79.7, 12.83)
SELECT name, city, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(79.7, 12.83), 4326)::geography) AS distance_m
FROM places_spatial
WHERE category = 'Hospital'
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(79.7, 12.83), 4326)::geography, 3000)
ORDER BY distance_m;

-- 8. Filter by city + category + distance (e.g., Chennai, 'Shop', within 1km of 80.25, 13.05)
SELECT name, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(80.25, 13.05), 4326)::geography) AS distance_m
FROM places_spatial
WHERE city = 'Chennai' AND category = 'Shop'
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(80.25, 13.05), 4326)::geography, 1000)
ORDER BY distance_m;

-- 9. Find the nearest place in each selected category from a given point (e.g., Madurai: 78.12, 9.93)
SELECT DISTINCT ON (category) category, name, 
       ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(78.12, 9.93), 4326)::geography) AS distance_m
FROM places_spatial
WHERE category IN ('Hospital', 'Temple', 'Restaurant')
ORDER BY category, geom <-> ST_SetSRID(ST_MakePoint(78.12, 9.93), 4326);

-- 10. Return results ordered by distance (combining multiple categories)
SELECT name, category, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(80.2, 13.0), 4326)::geography) AS distance_m
FROM places_spatial
WHERE category IN ('Cafe', 'Bank', 'ATM')
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(80.2, 13.0), 4326)::geography, 2000)
ORDER BY distance_m;
