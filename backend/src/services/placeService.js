const Place = require('../../../database/mongodb/placeModel');

async function getPlacesByIds(osmIds) {
    if (!osmIds.length) return [];
    return Place.find({ osm_id: { $in: osmIds } }).lean();
}

async function getPlaceIdsByName(query, limit = 500) {
    const normalized = String(query || '').trim();
    if (!normalized) return null;
    const places = await Place.find(
        { $text: { $search: normalized } },
        { osm_id: 1, _id: 0 }
    ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean();
    return places.map((place) => Number(place.osm_id));
}

async function getPlaceById(osmId) {
    return Place.findOne({ osm_id: osmId }).lean();
}

module.exports = { getPlacesByIds, getPlaceIdsByName, getPlaceById };