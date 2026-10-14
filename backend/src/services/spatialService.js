const { spatialPool } = require('../db/spatial');

const MAX_RADIUS_KM = 50;
const MAX_FILTER_LENGTH = 80;
const MAX_RESULT_LIMIT = 100;
const SORTS = new Set(['distance', 'distance_desc', 'name']);

function validateSearchParameters({ city, category, latitude, longitude, radius, sort = 'distance', limit = MAX_RESULT_LIMIT }) {
    const parsed = {
        city: city ? String(city).trim() : null,
        category: category ? String(category).trim() : null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius),
        sort: String(sort || 'distance'),
        limit: Number(limit)
    };

    if (!Number.isFinite(parsed.latitude) || parsed.latitude < -90 || parsed.latitude > 90) {
        throw new Error('latitude must be between -90 and 90');
    }
    if (!Number.isFinite(parsed.longitude) || parsed.longitude < -180 || parsed.longitude > 180) {
        throw new Error('longitude must be between -180 and 180');
    }
    if (!Number.isFinite(parsed.radius) || parsed.radius <= 0 || parsed.radius > MAX_RADIUS_KM) {
        throw new Error(`radius must be greater than 0 and no more than ${MAX_RADIUS_KM} km`);
    }
    if (parsed.city && parsed.city.length > MAX_FILTER_LENGTH) {
        throw new Error(`city must be no more than ${MAX_FILTER_LENGTH} characters`);
    }
    if (parsed.category && parsed.category.length > MAX_FILTER_LENGTH) {
        throw new Error(`category must be no more than ${MAX_FILTER_LENGTH} characters`);
    }
    if (!SORTS.has(parsed.sort)) throw new Error('sort must be distance, distance_desc, or name');
    if (!Number.isInteger(parsed.limit) || parsed.limit <= 0 || parsed.limit > MAX_RESULT_LIMIT) {
        throw new Error(`limit must be an integer between 1 and ${MAX_RESULT_LIMIT}`);
    }
    return parsed;
}

async function searchNearbyPlaces(parameters) {
    const { city, category, latitude, longitude, radius, sort, limit } = validateSearchParameters(parameters);
    const values = [longitude, latitude, radius * 1000];
    const filters = [
        'ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)'
    ];

    if (city) {
        values.push(city);
        filters.push(`city = $${values.length}`);
    }
    if (category) {
        values.push(category);
        filters.push(`category = $${values.length}`);
    }
    if (parameters.osmIds) {
        if (!parameters.osmIds.length) return [];
        values.push(parameters.osmIds);
        filters.push(`osm_id = ANY($${values.length}::BIGINT[])`);
    }

    const orderBy = sort === 'name'
        ? 'name ASC NULLS LAST, distance_meters ASC'
        : sort === 'distance_desc' ? 'distance_meters DESC' : 'distance_meters ASC';

    const query = `
        SELECT osm_id, name, category, city, lat AS latitude, lon AS longitude,
               ST_Distance(
                   geom::geography,
                   ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
               ) AS distance_meters
        FROM places_spatial
        WHERE ${filters.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT ${limit}`;

    const result = await spatialPool.query(query, values);
    return result.rows;
}

async function getPlaceSpatialInfo(osmId) {
    const result = await spatialPool.query(
        `SELECT osm_id, name, category, city, lat AS latitude, lon AS longitude
         FROM places_spatial WHERE osm_id = $1 LIMIT 1`,
        [osmId]
    );
    return result.rows[0] || null;
}

async function getPlacesSpatialInfo(osmIds) {
    if (!osmIds.length) return [];
    const result = await spatialPool.query(
        `SELECT osm_id, name, category, city, lat AS latitude, lon AS longitude
         FROM places_spatial WHERE osm_id = ANY($1::BIGINT[])`,
        [osmIds]
    );
    return result.rows;
}

async function getNearestPlaces(parameters) {
    return searchNearbyPlaces(parameters);
}

module.exports = {
    MAX_RADIUS_KM,
    MAX_RESULT_LIMIT,
    validateSearchParameters,
    searchNearbyPlaces,
    getPlaceSpatialInfo,
    getPlacesSpatialInfo,
    getNearestPlaces
};