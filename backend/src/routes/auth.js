const express = require('express');
const authService = require('../services/authService');
const userService = require('../services/userService');
const { requireAuth } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/register', asyncHandler(async (request, response) => {
    const result = await authService.register(request.body || {});
    response.status(201).json({ success: true, message: 'Registration successful', ...result });
}));

router.post('/login', asyncHandler(async (request, response) => {
    const result = await authService.login(request.body || {});
    response.json({ success: true, message: 'Login successful', ...result });
}));

router.post('/logout', (request, response) => response.json({ success: true, message: 'Logged out' }));

router.get('/me', requireAuth, (request, response) => response.json({ success: true, user: request.user }));

router.put('/profile', requireAuth, asyncHandler(async (request, response) => {
    const name = authService.validateName(request.body?.name);
    const user = await userService.updateUserName(request.user.id, name);
    response.json({ success: true, user: authService.publicUser(user) });
}));

router.put('/change-password', requireAuth, asyncHandler(async (request, response) => {
    await authService.changePassword(request.user.id, request.body?.currentPassword, request.body?.newPassword);
    response.json({ success: true, message: 'Password changed successfully' });
}));

module.exports = router;
