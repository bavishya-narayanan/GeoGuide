CREATE TEMP TABLE places_raw (
    osm_id BIGINT,
    osm_type VARCHAR(20),
    city VARCHAR(100),
    category VARCHAR(100),
    name TEXT,
    name_en TEXT,
    name_ta TEXT,
    lat NUMERIC(10, 7),
    lon NUMERIC(10, 7),
    amenity VARCHAR(100),
    tourism VARCHAR(100),
    shop VARCHAR(100),
    leisure VARCHAR(100),
    historic VARCHAR(100),
    healthcare VARCHAR(100),
    railway VARCHAR(100),
    aeroway VARCHAR(100),
    religion VARCHAR(100),
    operator TEXT,
    opening_hours TEXT,
    phone VARCHAR(255),
    website TEXT,
    addr_street TEXT,
    addr_city VARCHAR(255)
);

\copy places_raw FROM 'c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/processed/geoguide_pois.csv' DELIMITER ',' CSV HEADER;

INSERT INTO places_spatial (osm_id, osm_type, city, category, name, name_en, name_ta, lat, lon, amenity, tourism, shop, leisure, historic, healthcare, railway, aeroway, religion, operator, opening_hours, phone, website, addr_street, addr_city, geom)
SELECT osm_id, osm_type, city, category, name, name_en, name_ta, lat, lon, amenity, tourism, shop, leisure, historic, healthcare, railway, aeroway, religion, operator, opening_hours, phone, website, addr_street, addr_city, ST_SetSRID(ST_MakePoint(lon, lat), 4326)
FROM places_raw;

-- Create spatial and normal indexes
CREATE INDEX idx_places_spatial_geom ON places_spatial USING GIST (geom);
CREATE INDEX idx_places_spatial_city ON places_spatial (city);
CREATE INDEX idx_places_spatial_category ON places_spatial (category);
CREATE INDEX idx_places_spatial_osm_id ON places_spatial (osm_id);

-- Create views
CREATE OR REPLACE VIEW city_place_summary AS
SELECT city, category, COUNT(*) as place_count
FROM places_spatial
GROUP BY city, category
ORDER BY city, place_count DESC;

CREATE OR REPLACE VIEW category_summary AS
SELECT category, COUNT(*) as place_count
FROM places_spatial
GROUP BY category
ORDER BY place_count DESC;
