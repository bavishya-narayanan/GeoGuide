DROP TABLE IF EXISTS places_spatial CASCADE;

CREATE TABLE places_spatial (
    id SERIAL PRIMARY KEY,
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
    addr_city VARCHAR(255),
    geom GEOMETRY(Point, 4326)
);

-- Matches the production ST_DWithin(geom::geography, ...) predicate used for meter-accurate searches.
CREATE INDEX IF NOT EXISTS idx_places_spatial_geography ON places_spatial USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS idx_places_spatial_geom ON places_spatial USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_places_spatial_city ON places_spatial (city);
CREATE INDEX IF NOT EXISTS idx_places_spatial_category ON places_spatial (category);
CREATE INDEX IF NOT EXISTS idx_places_spatial_osm_id ON places_spatial (osm_id);
