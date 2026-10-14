const express = require('express');
const userService = require('../services/userService');
const searchService = require('../services/searchService');
const { requireAuth } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/me/favorites', requireAuth, asyncHandler(async (request, response) => {
    const results = await searchService.getFavoritePlaces(request.user.id);
    response.json({ success: true, count: results.length, results });
}));

router.get('/me/search-history', requireAuth, asyncHandler(async (request, response) => {
    const results = await userService.getSearchHistory(request.user.id);
    response.json({ success: true, count: results.length, results });
}));

router.delete('/me/search-history', requireAuth, asyncHandler(async (request, response) => {
    const removed = await userService.clearSearchHistory(request.user.id);
    response.json({ success: true, removed });
}));

router.get('/me/ratings', requireAuth, asyncHandler(async (request, response) => {
    const results = await userService.getUserRatings(request.user.id);
    response.json({ success: true, count: results.length, results });
}));

router.get('/me/reviews', requireAuth, asyncHandler(async (request, response) => {
    const results = await searchService.getReviewPlaces(request.user.id);
    response.json({ success: true, count: results.length, results });
}));

router.get('/me/preferences', requireAuth, asyncHandler(async (request, response) => {
    const result = await userService.getPreferences(request.user.id);
    response.json({ success: true, result });
}));

router.put('/me/preferences', requireAuth, asyncHandler(async (request, response) => {
    const result = await userService.updatePreferences(request.user.id, request.body?.categories, request.body?.city);
    response.json({ success: true, result });
}));

router.get('/me/dashboard', requireAuth, asyncHandler(async (request, response) => {
    const [profile, stats, preferences] = await Promise.all([
        userService.getProfile(request.user.id),
        userService.getDashboardSummary(request.user.id),
        userService.getPreferences(request.user.id)
    ]);
    response.json({ success: true, result: { profile, stats, preferences } });
}));

module.exports = router;