const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userService = require('./userService');

const PASSWORD_ROUNDS = 12;

function authError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function normalizeEmail(email) {
    if (typeof email !== 'string') throw authError('email is required');
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw authError('email must be valid');
    return normalized;
}

function validatePassword(password, field = 'password') {
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        throw authError(`${field} must be between 8 and 128 characters`);
    }
}

function validateName(name) {
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 120) {
        throw authError('name must contain 1 to 120 characters');
    }
    return name.trim();
}

function publicUser(user) {
    return { id: Number(user.id), name: user.name, email: user.email, created_at: user.created_at };
}

function issueToken(user) {
    if (!env.auth.jwtSecret) throw authError('authentication is not configured', 500);
    return jwt.sign({ sub: String(user.id) }, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpiresIn });
}

async function register({ name, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = validateName(name);
    validatePassword(password);
    if (await userService.userByEmail(normalizedEmail)) throw authError('email already exists', 409);
    const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
    try {
        const user = await userService.createUser(normalizedName, normalizedEmail, passwordHash);
        return { user: publicUser(user), token: issueToken(user) };
    } catch (error) {
        if (error.code === '23505') throw authError('email already exists', 409);
        throw error;
    }
}

async function login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    validatePassword(password);
    const user = await userService.userByEmail(normalizedEmail);
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
        throw authError('invalid email or password', 401);
    }
    return { user: publicUser(user), token: issueToken(user) };
}

async function changePassword(userId, currentPassword, newPassword) {
    validatePassword(currentPassword, 'currentPassword');
    validatePassword(newPassword, 'newPassword');
    if (currentPassword === newPassword) throw authError('newPassword must be different from currentPassword');
    const user = await userService.userByIdWithPassword(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) throw authError('current password is incorrect', 401);
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_ROUNDS);
    await userService.updatePassword(userId, passwordHash);
}

module.exports = { authError, normalizeEmail, validatePassword, validateName, publicUser, issueToken, register, login, changePassword };
