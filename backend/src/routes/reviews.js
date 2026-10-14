const express = require('express');
const userService = require('../services/userService');
const { requireAuth } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { interactionLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.put('/:reviewId', interactionLimiter, requireAuth, asyncHandler(async (request, response) => {
    const result = await userService.updateReview(request.user.id, request.params.reviewId, request.body?.reviewText);
    if (!result) return response.status(404).json({ success: false, error: 'review not found' });
    response.json({ success: true, result });
}));

router.delete('/:reviewId', interactionLimiter, requireAuth, asyncHandler(async (request, response) => {
    const result = await userService.deleteReview(request.user.id, request.params.reviewId);
    if (!result) return response.status(404).json({ success: false, error: 'review not found' });
    response.json({ success: true, result });
}));

module.exports = router;