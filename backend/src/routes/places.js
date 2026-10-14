const express = require('express');
const spatialService = require('../services/spatialService');
const searchService = require('../services/searchService');
const userService = require('../services/userService');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { searchLimiter, interactionLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

async function requirePlace(osmId) {
    const place = await spatialService.getPlaceSpatialInfo(userService.parsePlaceId(osmId));
    if (!place) throw new Error('place not found');
    return place;
}

router.get('/search', searchLimiter, optionalAuth, asyncHandler(async (request, response) => {
    const results = await searchService.searchPlaces({
        city: request.query.city,
        category: request.query.category,
        latitude: request.query.latitude,
        longitude: request.query.longitude,
        radius: request.query.radius,
        userId: request.user?.id,
        searchQuery: request.query.query || request.query.q || '',
        sort: request.query.sort,
        limit: request.query.limit
    });
    response.json({ success: true, count: results.length, results });
}));

router.get('/:osmId', optionalAuth, asyncHandler(async (request, response) => {
    const place = await searchService.getCombinedPlace(request.params.osmId, request.user?.id);
    if (!place) return response.status(404).json({ success: false, error: 'place not found' });
    response.json({ success: true, result: place });
}));

router.post('/:osmId/rating', interactionLimiter, requireAuth, asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const result = await userService.addRating(request.user.id, request.params.osmId, request.body.rating);
    response.status(201).json({ success: true, result });
}));

router.put('/:osmId/rating', interactionLimiter, requireAuth, asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const result = await userService.addRating(request.user.id, request.params.osmId, request.body.rating);
    response.json({ success: true, result });
}));

router.get('/:osmId/ratings', asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const results = await userService.getRatings(request.params.osmId);
    response.json({ success: true, count: results.length, results });
}));

router.post('/:osmId/review', interactionLimiter, requireAuth, asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const result = await userService.addReview(request.user.id, request.params.osmId, request.body.reviewText);
    response.status(201).json({ success: true, result });
}));

router.get('/:osmId/reviews', asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const results = await userService.getReviews(request.params.osmId);
    response.json({ success: true, count: results.length, results });
}));

router.post('/:osmId/favorite', requireAuth, asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const result = await userService.addFavorite(request.user.id, request.params.osmId);
    response.status(201).json({ success: true, result });
}));

router.delete('/:osmId/favorite', requireAuth, asyncHandler(async (request, response) => {
    await requirePlace(request.params.osmId);
    const result = await userService.removeFavorite(request.user.id, request.params.osmId);
    response.json({ success: true, removed: Boolean(result), result });
}));

module.exports = router;