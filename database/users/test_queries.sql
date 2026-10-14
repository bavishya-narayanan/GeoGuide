-- Demo-only CRUD and constraint checks for geoguide_users.
-- The OSM IDs below are real values from dataset/processed/geoguide_pois.csv.
-- Run this only in a disposable validation database or after reviewing the cleanup.

TRUNCATE search_history, favorites, reviews, ratings, user_preferences, users RESTART IDENTITY CASCADE;

-- Users: create, read, update, and deactivate.
INSERT INTO users (name, email, password_hash)
VALUES ('GeoGuide Demo User', 'demo.user@geoguide.local', '$2b$12$demo-hash-not-for-authentication'),
       ('GeoGuide Second Demo User', 'second.user@geoguide.local', '$2b$12$second-demo-hash-not-for-authentication')
RETURNING id, name, email, is_active;

SELECT id, name, email, is_active FROM users WHERE email = 'demo.user@geoguide.local';
UPDATE users SET name = 'Updated GeoGuide Demo User', updated_at = CURRENT_TIMESTAMP
WHERE email = 'demo.user@geoguide.local';
UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE email = 'second.user@geoguide.local';

-- Preferences: one row per user, with categories represented as a flexible text array.
INSERT INTO user_preferences (user_id, preferred_city, preferred_categories)
SELECT id, 'Kanchipuram', ARRAY['Temple', 'Restaurant', 'Tourist Attraction']::TEXT[]
FROM users WHERE email = 'demo.user@geoguide.local';
SELECT user_id, preferred_city, preferred_categories FROM user_preferences;
UPDATE user_preferences
SET preferred_categories = ARRAY['Temple', 'Cafe']::TEXT[], updated_at = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local');

-- Ratings: 243060332 and 247432808 are real OSM IDs in the Phase 1 CSV.
INSERT INTO ratings (user_id, place_osm_id, rating)
SELECT id, 243060332, 5 FROM users WHERE email = 'demo.user@geoguide.local';
SELECT * FROM ratings WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local');
UPDATE ratings SET rating = 4, updated_at = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local')
  AND place_osm_id = 243060332;

DO $$
BEGIN
    BEGIN
        INSERT INTO ratings (user_id, place_osm_id, rating)
        SELECT id, 247432808, 0 FROM users WHERE email = 'demo.user@geoguide.local';
        RAISE EXCEPTION 'invalid rating was accepted';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS: rating 0 rejected';
    END;
    BEGIN
        INSERT INTO ratings (user_id, place_osm_id, rating)
        SELECT id, 247432808, 6 FROM users WHERE email = 'demo.user@geoguide.local';
        RAISE EXCEPTION 'invalid rating was accepted';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS: rating 6 rejected';
    END;
    BEGIN
        INSERT INTO ratings (user_id, place_osm_id, rating)
        SELECT id, 243060332, 5 FROM users WHERE email = 'demo.user@geoguide.local';
        RAISE EXCEPTION 'duplicate rating was accepted';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS: duplicate user-place rating rejected';
    END;
END $$;

-- Reviews: one active review per user and place.
INSERT INTO reviews (user_id, place_osm_id, review_text)
SELECT id, 243060332, 'Convenient location and useful transport information.'
FROM users WHERE email = 'demo.user@geoguide.local';
SELECT * FROM reviews WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local');
UPDATE reviews SET review_text = 'Updated demo review.', updated_at = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local')
  AND place_osm_id = 243060332;

DO $$
BEGIN
    BEGIN
        INSERT INTO reviews (user_id, place_osm_id, review_text)
        SELECT id, 247432808, '   ' FROM users WHERE email = 'demo.user@geoguide.local';
        RAISE EXCEPTION 'empty review was accepted';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS: empty review rejected';
    END;
    BEGIN
        INSERT INTO reviews (user_id, place_osm_id, review_text)
        SELECT id, 243060332, 'Duplicate review' FROM users WHERE email = 'demo.user@geoguide.local';
        RAISE EXCEPTION 'duplicate review was accepted';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS: duplicate user-place review rejected';
    END;
END $$;

-- Favorites: add two, read them, remove one, and verify duplicate protection.
INSERT INTO favorites (user_id, place_osm_id)
SELECT id, place_osm_id
FROM users CROSS JOIN (VALUES (243060332::BIGINT), (247432808::BIGINT)) AS places(place_osm_id)
WHERE email = 'demo.user@geoguide.local';
SELECT * FROM favorites WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local');
DELETE FROM favorites
WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local')
  AND place_osm_id = 247432808;

DO $$
BEGIN
    BEGIN
        INSERT INTO favorites (user_id, place_osm_id)
        SELECT id, 243060332 FROM users WHERE email = 'demo.user@geoguide.local';
        RAISE EXCEPTION 'duplicate favorite was accepted';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS: duplicate favorite rejected';
    END;
END $$;

-- Search history: coordinate/radius fields remain optional for non-spatial searches.
INSERT INTO search_history (user_id, search_query, category, city, latitude, longitude, radius_km)
SELECT id, 'temples', 'Temple', 'Kanchipuram', 12.8342, 79.7036, 5.000
FROM users WHERE email = 'demo.user@geoguide.local';
INSERT INTO search_history (user_id, search_query, category, city)
SELECT id, 'restaurants', 'Restaurant', 'Chennai'
FROM users WHERE email = 'demo.user@geoguide.local';
INSERT INTO search_history (user_id, search_query, city)
SELECT id, 'nearby places', 'Madurai'
FROM users WHERE email = 'demo.user@geoguide.local';

SELECT * FROM search_history
WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local')
ORDER BY searched_at DESC LIMIT 10;
SELECT * FROM search_history
WHERE city = 'Kanchipuram' AND category = 'Temple';

-- Typical interaction reads.
SELECT * FROM favorites WHERE user_id = (SELECT id FROM users WHERE email = 'demo.user@geoguide.local');
SELECT * FROM ratings WHERE place_osm_id = 243060332;
SELECT * FROM reviews WHERE place_osm_id = 243060332;