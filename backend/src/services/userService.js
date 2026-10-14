const { usersPool } = require('../db/users');

function parseUserId(userId) {
    const parsed = Number(userId);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('userId must be a positive integer');
    return parsed;
}

function parsePlaceId(placeId) {
    const parsed = Number(placeId);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error('osm_id must be a positive integer');
    return parsed;
}

async function userExists(userId) {
    const result = await usersPool.query('SELECT 1 FROM users WHERE id = $1 AND is_active = TRUE', [parseUserId(userId)]);
    return result.rowCount === 1;
}

async function userByEmail(email) {
    const result = await usersPool.query(
        'SELECT id, name, email, password_hash, created_at, is_active FROM users WHERE lower(email) = lower($1) LIMIT 1',
        [email]
    );
    return result.rows[0] || null;
}

async function userByIdWithPassword(userId) {
    const result = await usersPool.query(
        'SELECT id, name, email, password_hash, created_at, is_active FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1',
        [parseUserId(userId)]
    );
    return result.rows[0] || null;
}

async function createUser(name, email, passwordHash) {
    const result = await usersPool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email, passwordHash]
    );
    return result.rows[0];
}

async function updateUserName(userId, name) {
    const result = await usersPool.query(
        `UPDATE users SET name = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND is_active = TRUE
         RETURNING id, name, email, created_at`,
        [parseUserId(userId), name]
    );
    return result.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
    await usersPool.query(
        'UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = TRUE',
        [parseUserId(userId), passwordHash]
    );
}

async function getProfile(userId) {
    const result = await usersPool.query(
        `SELECT u.id, u.name, u.email, u.created_at, p.preferred_city, p.preferred_categories
         FROM users u
         LEFT JOIN user_preferences p ON p.user_id = u.id
         WHERE u.id = $1 AND u.is_active = TRUE`,
        [parseUserId(userId)]
    );
    return result.rows[0] || null;
}

async function getUserInteraction(userId, placeId) {
    const user = parseUserId(userId);
    const place = parsePlaceId(placeId);
    const result = await usersPool.query(
        `SELECT
            (SELECT rating FROM ratings WHERE user_id = $1 AND place_osm_id = $2) AS rating,
            (SELECT review_text FROM reviews WHERE user_id = $1 AND place_osm_id = $2) AS review,
            EXISTS (SELECT 1 FROM favorites WHERE user_id = $1 AND place_osm_id = $2) AS is_favorite`,
        [user, place]
    );
    return result.rows[0] || { rating: null, review: null, is_favorite: false };
}

async function getUserRating(userId, placeId) {
    const interaction = await getUserInteraction(userId, placeId);
    return interaction.rating;
}

async function getUserReview(userId, placeId) {
    const interaction = await getUserInteraction(userId, placeId);
    return interaction.review;
}

async function isFavorite(userId, placeId) {
    const interaction = await getUserInteraction(userId, placeId);
    return interaction.is_favorite;
}

async function getUserInteractions(userId, placeIds) {
    const user = parseUserId(userId);
    if (!placeIds.length) return new Map();
    const result = await usersPool.query(
        `SELECT p.place_osm_id,
                r.rating,
                v.review_text AS review,
                (f.id IS NOT NULL) AS is_favorite
         FROM unnest($2::BIGINT[]) AS p(place_osm_id)
         LEFT JOIN ratings r ON r.user_id = $1 AND r.place_osm_id = p.place_osm_id
         LEFT JOIN reviews v ON v.user_id = $1 AND v.place_osm_id = p.place_osm_id
         LEFT JOIN favorites f ON f.user_id = $1 AND f.place_osm_id = p.place_osm_id`,
        [user, placeIds]
    );
    return new Map(result.rows.map(row => [String(row.place_osm_id), row]));
}

async function saveSearchHistory(userId, search) {
    const user = parseUserId(userId);
    await usersPool.query(
        `INSERT INTO search_history
            (user_id, search_query, category, city, latitude, longitude, radius_km)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user, search.searchQuery || 'place search', search.category || null, search.city || null,
            search.latitude, search.longitude, search.radius]
    );
}

async function addRating(userId, placeId, rating) {
    const user = parseUserId(userId);
    const place = parsePlaceId(placeId);
    const value = Number(rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('rating must be an integer from 1 to 5');
    const result = await usersPool.query(
        `INSERT INTO ratings (user_id, place_osm_id, rating)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, place_osm_id)
         DO UPDATE SET rating = EXCLUDED.rating, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [user, place, value]
    );
    return result.rows[0];
}

async function getRatings(placeId) {
    const place = parsePlaceId(placeId);
    const result = await usersPool.query(
        'SELECT user_id, place_osm_id, rating, created_at, updated_at FROM ratings WHERE place_osm_id = $1 ORDER BY created_at DESC',
        [place]
    );
    return result.rows;
}

async function addReview(userId, placeId, reviewText) {
    const user = parseUserId(userId);
    const place = parsePlaceId(placeId);
    if (typeof reviewText !== 'string' || reviewText.trim().length === 0 || reviewText.trim().length > 5000) {
        throw new Error('reviewText must contain 1 to 5000 non-whitespace characters');
    }
    const result = await usersPool.query(
        `INSERT INTO reviews (user_id, place_osm_id, review_text)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, place_osm_id)
         DO UPDATE SET review_text = EXCLUDED.review_text, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [user, place, reviewText.trim()]
    );
    return result.rows[0];
}

async function getReviews(placeId) {
    const place = parsePlaceId(placeId);
    const result = await usersPool.query(
        `SELECT r.id, r.user_id, u.name AS user_name, r.place_osm_id, r.review_text,
            r.created_at, r.updated_at, rt.rating
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN ratings rt ON rt.user_id = r.user_id AND rt.place_osm_id = r.place_osm_id
         WHERE r.place_osm_id = $1 ORDER BY r.created_at DESC`,
        [place]
    );
    return result.rows;
}

async function updateReview(userId, reviewId, reviewText) {
    const text = typeof reviewText === 'string' ? reviewText.trim() : '';
    if (!text || text.length > 5000) throw new Error('reviewText must contain 1 to 5000 non-whitespace characters');
    const result = await usersPool.query(
        `UPDATE reviews SET review_text = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [parsePlaceId(reviewId), parseUserId(userId), text]
    );
    return result.rows[0] || null;
}

async function deleteReview(userId, reviewId) {
    const result = await usersPool.query(
        'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
        [parsePlaceId(reviewId), parseUserId(userId)]
    );
    return result.rows[0] || null;
}

async function getRatingSummary(placeId) {
    const result = await usersPool.query(
        `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS average,
                COUNT(*)::int AS count
         FROM ratings WHERE place_osm_id = $1`,
        [parsePlaceId(placeId)]
    );
    return { average: Number(result.rows[0].average), count: result.rows[0].count };
}

async function getRatingSummaries(placeIds) {
    if (!placeIds.length) return new Map();
    const result = await usersPool.query(
        `SELECT place_osm_id, COALESCE(AVG(rating), 0)::numeric(3,2) AS average,
                COUNT(*)::int AS count
         FROM ratings WHERE place_osm_id = ANY($1::BIGINT[])
         GROUP BY place_osm_id`,
        [placeIds]
    );
    return new Map(result.rows.map((row) => [String(row.place_osm_id), { average: Number(row.average), count: row.count }]));
}

async function clearSearchHistory(userId) {
    const result = await usersPool.query(
        'DELETE FROM search_history WHERE user_id = $1',
        [parseUserId(userId)]
    );
    return result.rowCount;
}

const PREFERENCE_CATEGORIES = new Set(['Temple', 'Restaurant', 'Cafe', 'Hospital', 'Hotel', 'Market / Shopping', 'Park', 'Tourist Attraction', 'Transport']);

async function getPreferences(userId) {
    const profile = await getProfile(userId);
    return { city: profile?.preferred_city || null, categories: profile?.preferred_categories || [] };
}

async function getDashboardSummary(userId) {
    const user = parseUserId(userId);
    const result = await usersPool.query(
        `SELECT
            (SELECT COUNT(*)::int FROM favorites WHERE user_id = $1) AS favorites,
            (SELECT COUNT(*)::int FROM reviews WHERE user_id = $1) AS reviews,
            (SELECT COUNT(*)::int FROM search_history WHERE user_id = $1) AS searches,
            (SELECT COUNT(*)::int FROM ratings WHERE user_id = $1) AS ratings`,
        [user]
    );
    return result.rows[0];
}

async function updatePreferences(userId, categories, city = null) {
    if (!Array.isArray(categories) || categories.some((category) => !PREFERENCE_CATEGORIES.has(category))) {
        throw new Error('categories must contain only valid dataset categories');
    }
    const result = await usersPool.query(
        `INSERT INTO user_preferences (user_id, preferred_city, preferred_categories)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET preferred_city = EXCLUDED.preferred_city,
             preferred_categories = EXCLUDED.preferred_categories, updated_at = CURRENT_TIMESTAMP
         RETURNING preferred_city, preferred_categories`,
        [parseUserId(userId), city || null, [...new Set(categories)]]
    );
    return { city: result.rows[0].preferred_city, categories: result.rows[0].preferred_categories };
}

async function getUserRatings(userId) {
    const result = await usersPool.query(
        'SELECT place_osm_id, rating, created_at, updated_at FROM ratings WHERE user_id = $1 ORDER BY updated_at DESC',
        [parseUserId(userId)]
    );
    return result.rows;
}

async function getUserReviews(userId) {
    const result = await usersPool.query(
        'SELECT place_osm_id, review_text, created_at, updated_at FROM reviews WHERE user_id = $1 ORDER BY updated_at DESC',
        [parseUserId(userId)]
    );
    return result.rows;
}

async function addFavorite(userId, placeId) {
    const user = parseUserId(userId);
    const place = parsePlaceId(placeId);
    const result = await usersPool.query(
        `INSERT INTO favorites (user_id, place_osm_id) VALUES ($1, $2)
         ON CONFLICT (user_id, place_osm_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING *`,
        [user, place]
    );
    return result.rows[0];
}

async function removeFavorite(userId, placeId) {
    const result = await usersPool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND place_osm_id = $2 RETURNING *',
        [parseUserId(userId), parsePlaceId(placeId)]
    );
    return result.rows[0] || null;
}

async function getFavorites(userId) {
    const result = await usersPool.query(
        'SELECT place_osm_id, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
        [parseUserId(userId)]
    );
    return result.rows;
}

async function getSearchHistory(userId) {
    const result = await usersPool.query(
        'SELECT * FROM search_history WHERE user_id = $1 ORDER BY searched_at DESC LIMIT 100',
        [parseUserId(userId)]
    );
    return result.rows;
}

module.exports = {
    parseUserId,
    parsePlaceId,
    userExists,
    userByEmail,
    userByIdWithPassword,
    createUser,
    updateUserName,
    updatePassword,
    getProfile,
    getUserRating,
    getUserReview,
    isFavorite,
    getUserInteraction,
    getUserInteractions,
    saveSearchHistory,
    addRating,
    getRatings,
    addReview,
    getReviews,
    updateReview,
    deleteReview,
    getRatingSummary,
    getRatingSummaries,
    clearSearchHistory,
    getPreferences,
    updatePreferences,
    getDashboardSummary,
    getUserRatings,
    getUserReviews,
    addFavorite,
    removeFavorite,
    getFavorites,
    getSearchHistory
};