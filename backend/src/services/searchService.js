const { searchNearbyPlaces, getPlaceSpatialInfo, getPlacesSpatialInfo } = require('./spatialService');
const { getPlacesByIds, getPlaceIdsByName, getPlaceById } = require('./placeService');
const userService = require('./userService');

/**
 * Generate a human-readable display name when the raw name is missing.
 * Uses the readable category label and city so users never see "Unnamed X".
 * Examples:
 *   category="restaurant", city="Chennai"  →  "Restaurant · Chennai"
 *   category="park",       city=null       →  "Park"
 */
function buildDisplayName(spatial) {
    if (spatial.name && spatial.name.trim()) return spatial.name.trim();

    const category = spatial.category || '';
    const readableCategory = category
        ? category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')
        : 'Place';

    const city = spatial.city && spatial.city.trim() ? spatial.city.trim() : null;
    return city ? `${readableCategory} · ${city}` : readableCategory;
}

function mergePlace(spatial, details, interaction = null) {
    const displayName = buildDisplayName(spatial);
    return {
        osm_id: Number(spatial.osm_id),
        name: spatial.name,
        display_name: displayName,
        category: spatial.category,
        city: spatial.city,
        latitude: Number(spatial.latitude),
        longitude: Number(spatial.longitude),
        location: { latitude: spatial.latitude, longitude: spatial.longitude },
        ...(spatial.distance_meters === undefined ? {} : { distance_meters: Number(spatial.distance_meters) }),
        details: details ? {
            address: details.address || {},
            contact: details.contact || {},
            opening_hours: details.opening_hours || null,
            facilities: details.attributes ? Object.values(details.attributes).filter(Boolean) : [],
            source: details.source || null
        } : null,
        user_interaction: interaction ? {
            rating: interaction.rating === null ? null : Number(interaction.rating),
            review: interaction.review || null,
            is_favorite: Boolean(interaction.is_favorite)
        } : undefined
    };
}

async function combinePlaces(spatialRows, interactions = new Map(), reviewsByPlace = new Map()) {
    const ids = spatialRows.map((row) => Number(row.osm_id));
    const [details, ratingSummaries] = await Promise.all([getPlacesByIds(ids), userService.getRatingSummaries(ids)]);
    const detailsById = new Map(details.map((place) => [String(place.osm_id), place]));
    return spatialRows.map((row) => {
        const interaction = interactions.get(String(row.osm_id));
        const result = { ...mergePlace(row, detailsById.get(String(row.osm_id)), interaction), rating_summary: ratingSummaries.get(String(row.osm_id)) || { average: 0, count: 0 } };
        return reviewsByPlace.has(String(row.osm_id)) ? { ...result, user_review: reviewsByPlace.get(String(row.osm_id)) } : result;
    });
}

async function searchPlaces(parameters) {
    const nameIds = parameters.searchQuery ? await getPlaceIdsByName(parameters.searchQuery) : null;
    const spatialRows = await searchNearbyPlaces({ ...parameters, osmIds: nameIds || parameters.osmIds });
    const ids = spatialRows.map(row => Number(row.osm_id));
    let interactions = new Map();

    if (parameters.userId !== undefined && parameters.userId !== null && parameters.userId !== '') {
        if (!(await userService.userExists(parameters.userId))) throw new Error('user not found or inactive');
        interactions = await userService.getUserInteractions(parameters.userId, ids);
        await userService.saveSearchHistory(parameters.userId, parameters);
    }

    return combinePlaces(spatialRows, interactions);
}

async function getFavoritePlaces(userId) {
    const favorites = await userService.getFavorites(userId);
    const ids = favorites.map((item) => Number(item.place_osm_id));
    const spatial = await getPlacesSpatialInfo(ids);
    const interactions = await userService.getUserInteractions(userId, ids);
    return combinePlaces(spatial, interactions);
}

async function getReviewPlaces(userId) {
    const reviews = await userService.getUserReviews(userId);
    const ids = reviews.map((item) => Number(item.place_osm_id));
    const spatial = await getPlacesSpatialInfo(ids);
    const reviewsByPlace = new Map(reviews.map((review) => [String(review.place_osm_id), review]));
    return combinePlaces(spatial, new Map(), reviewsByPlace);
}

async function getCombinedPlace(osmId, userId) {
    const spatial = await getPlaceSpatialInfo(userService.parsePlaceId(osmId));
    if (!spatial) return null;
    const details = await getPlaceById(Number(osmId));
    let interaction;
    if (userId !== undefined && userId !== null && userId !== '') {
        if (!(await userService.userExists(userId))) throw new Error('user not found or inactive');
        interaction = await userService.getUserInteraction(userId, osmId);
    }
    const result = mergePlace(spatial, details, interaction);
    const ratingSummary = await userService.getRatingSummary(osmId);
    return { ...result, rating_summary: ratingSummary };
}

module.exports = { searchPlaces, getCombinedPlace, getFavoritePlaces, getReviewPlaces, mergePlace };