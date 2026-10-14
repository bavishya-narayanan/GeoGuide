const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userService = require('../services/userService');

async function authenticate(request) {
    const header = request.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    if (!env.auth.jwtSecret) throw Object.assign(new Error('Authentication is not configured'), { status: 500 });
    const payload = jwt.verify(token, env.auth.jwtSecret);
    const user = await userService.getProfile(payload.sub);
    if (!user) return null;
    return user;
}

async function requireAuth(request, response, next) {
    try {
        request.user = await authenticate(request);
        if (!request.user) return response.status(401).json({ success: false, error: 'Authentication required' });
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return response.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        next(error);
    }
}

async function optionalAuth(request, response, next) {
    try {
        request.user = await authenticate(request);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return response.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        next(error);
    }
}

module.exports = { requireAuth, optionalAuth };
