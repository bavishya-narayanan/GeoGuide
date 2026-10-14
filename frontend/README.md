# GeoGuide Frontend

React + Vite frontend for GeoGuide. The browser communicates only with the Node.js API; it never connects directly to PostgreSQL, PostGIS, or MongoDB.

## Requirements

- Node.js 18+
- The GeoGuide backend and its three databases running locally

## Install and start

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

## Environment variables

`VITE_API_BASE_URL` is the public backend URL, normally `http://localhost:5000/api`.
`VITE_TEST_USER_ID` selects the Phase 5 development user. It is an ID only; no password or database credential belongs in this file.

## Routes

- `/` discovery home
- `/search` spatial search results
- `/places/:osmId` place details, ratings, reviews, and favorites
- `/favorites` saved places
- `/history` recent searches
- `/profile` development user profile

## API integration

All requests are centralized in `src/services/api.js`. Search sends the selected city coordinates, category, radius, and optional demo user ID to `GET /api/places/search`. Place interactions use the matching `/api/places/:osmId/*` routes. Favorites, history, and profile use `/api/users/:userId/*`.

## Common errors

- `Unable to connect to GeoGuide server`: start the backend on port 5000 or update `VITE_API_BASE_URL`.
- `user not found or inactive`: set `VITE_TEST_USER_ID` to an active row in `geoguide_users.users`.
- Empty results: widen the radius or choose another city/category. Results are returned by PostGIS and are not mocked.