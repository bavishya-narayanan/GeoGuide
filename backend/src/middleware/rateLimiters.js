const { rateLimit } = require('express-rate-limit');

const limiter = (windowMs, limit, message) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (request, response) => response.status(429).json({ success: false, error: message })
});

module.exports = {
    apiLimiter: limiter(15 * 60 * 1000, 300, 'Too many requests. Please try again later.'),
    authLimiter: limiter(15 * 60 * 1000, 30, 'Too many authentication attempts. Please try again later.'),
    searchLimiter: limiter(15 * 60 * 1000, 120, 'Too many searches. Please try again later.'),
    interactionLimiter: limiter(15 * 60 * 1000, 60, 'Too many interaction requests. Please try again later.')
};