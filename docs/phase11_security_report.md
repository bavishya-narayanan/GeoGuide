# Phase 11 Security Report

## 1. Authentication and Authorization

JWT bearer authentication remains backend-managed. Protected routes derive user identity from `req.user.id`. Missing or invalid tokens return 401. Review updates/deletes are ownership-scoped. Favorites, ratings, reviews, history, preferences, and dashboard data are user-scoped.

## 2. Password Security

Passwords use bcrypt hashing. Registration and login responses were checked for `password` and `password_hash`; neither was exposed. Password changes require the current password. No password logging was found.

## 3. Input Validation

Existing validation covers coordinates, radius, category, city, query, sort, limit, OSM IDs, ratings, reviews, email, password, and profile names. Invalid limit 101 returned 400. Malicious SQL-shaped category input returned safely with zero results.

## 4. SQL and MongoDB Security

PostgreSQL inputs use parameterized queries. MongoDB receives controlled text-search strings and validated candidate IDs, not arbitrary operators. No unsafe SQL concatenation or arbitrary MongoDB operator input was found.

## 5. HTTP Security

Helmet is enabled. CORS uses configured frontend origins with development defaults for localhost and 127.0.0.1. An evil origin did not receive an access-control allow-origin header.

## 6. Rate Limiting

Rate limits were added for:

- API traffic: 300 requests per 15 minutes
- Authentication: 30 requests per 15 minutes
- Search: 120 requests per 15 minutes
- Interaction writes: 60 requests per 15 minutes

## 7. Environment Security

JWT, database credentials, and MongoDB URI remain environment-configured. `.env` is ignored by `.gitignore`; `.env.example` contains placeholders only. No secrets were added to source code.

## 8. Error Handling

The centralized error handler returns safe 400, 401, 404, 409, 429, and 500 responses. Internal details are logged server-side only for 500 errors. Frontend Axios handling clears expired auth state and displays user-friendly errors.

## 9. Test Results

- Missing auth: 401.
- Invalid JWT: 401.
- Duplicate registration: 409.
- Wrong password: 401.
- Unauthenticated mutations: 401.
- Cross-user review mutation: denied with 404.
- Password fields: absent from registration/login responses.
- SQL injection-shaped input: safe response, no data expansion or server error.
- Dependency audits: 0 production vulnerabilities in backend and frontend.
- Backend source diagnostics and syntax checks: passed.

## 10. Known Limitations

JWT logout is stateless client-side token removal; server-side revocation is not implemented. Rate-limit state is process-local. CORS defaults are development origins and should be replaced with the deployed frontend origin before deployment in Phase 12.
