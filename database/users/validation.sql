-- Validation checks for the GeoGuide user and interaction database.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'user_preferences', 'ratings', 'reviews', 'favorites', 'search_history')
ORDER BY table_name;

SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'search_history', COUNT(*) FROM search_history
ORDER BY table_name;

SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

SELECT 'orphan_preferences' AS check_name, COUNT(*) AS failures
FROM user_preferences p LEFT JOIN users u ON u.id = p.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'orphan_ratings', COUNT(*) FROM ratings r LEFT JOIN users u ON u.id = r.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'orphan_reviews', COUNT(*) FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'orphan_favorites', COUNT(*) FROM favorites f LEFT JOIN users u ON u.id = f.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'orphan_search_history', COUNT(*) FROM search_history s LEFT JOIN users u ON u.id = s.user_id WHERE u.id IS NULL;

DO $$
BEGIN
  BEGIN
    INSERT INTO users (name, email, password_hash)
    VALUES ('Duplicate Email Test', 'demo.user@geoguide.local', 'test-hash');
    RAISE EXCEPTION 'duplicate email was accepted';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: duplicate email rejected';
  END;
  BEGIN
    INSERT INTO ratings (user_id, place_osm_id, rating)
    VALUES (999999999, 247432808, 5);
    RAISE EXCEPTION 'invalid user ID was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: invalid user ID rejected';
  END;
END $$;