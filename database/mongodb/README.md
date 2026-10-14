# GeoGuide MongoDB Setup

This directory contains the Mongoose models, connection logic, and seeding scripts for the "WHAT IS THE PLACE?" layer of GeoGuide.

## Installation & Setup

1. **Prerequisites:**
   - Node.js (v18+)
   - MongoDB Community Server running locally on `localhost:27017`

2. **Install Dependencies:**
   Navigate to `database/mongodb/` and run:
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and adjust variables if needed.
   ```bash
   cp .env.example .env
   ```

4. **Seed the Database:**
   To import the 17,023 places from the processed CSV into MongoDB:
   ```bash
   node seed.js
   ```

5. **Test Queries:**
   To execute sample Mongoose queries and aggregations:
   ```bash
   node queries.js
   ```

6. **Check PostGIS ↔ MongoDB Consistency:**
   ```bash
   node consistency_check.js
   ```

## Schema & Indexes
* **Database Name:** `geoguide_places`
* **Collection:** `places`
* **Unique Index:** `osm_id` (Ensures 1:1 mapping with PostGIS)
* **Compound Index:** `{ city: 1, category: 1 }` (Optimizes frontend dashboard loading)
* **Text Index:** `{ name: 'text', name_en: 'text', name_ta: 'text' }` (Powers the search engine)
