# Phase 3 – MongoDB Place Information Database

## 1. Objective
Establish the "WHAT IS THE PLACE" database layer using MongoDB to store detailed descriptive, contact, and category information for points of interest, keeping it architecturally distinct from the spatial "WHERE IS THE PLACE" PostGIS database.

## 2. MongoDB Architecture
* **Framework:** Node.js + Mongoose
* **Connection Logic:** Extracted to reusable `connection.js`
* **Integration:** Strictly uses `osm_id` as the primary integration key with PostGIS.

## 3. Database Name
`geoguide_places`

## 4. Collection Structure
Main collection: `places`. 
Fields include `osm_id`, `name`, `category`, `city`, `address` (street/city), `contact` (phone/website), `opening_hours`, and an `attributes` subdocument containing standard OSM keys (amenity, shop, tourism, etc).

## 5. Source Dataset
Imported directly from `dataset/processed/geoguide_pois.csv` which was generated in Phase 1.

## 6. Cities Covered
- Chennai
- Kanchipuram
- Madurai

## 7. Categories Found
Top categories identified include:
- Shop (3,690 in Chennai alone)
- Clinic / Healthcare
- Hospital
- Temple
- Restaurant

## 8. Number of Documents Imported
**17,023** records successfully seeded via `seed.js`.

## 9. Data Validation Results
100% valid. No duplicate `osm_id`s, no missing critical fields. See `database/mongodb/validation_report.md`.

## 10. Indexes Created
1. `osm_id` (Unique, ascending)
2. `city` (Ascending)
3. `category` (Ascending)
4. `{ city: 1, category: 1 }` (Compound index)
5. Text Index on `name`, `name_en`, and `name_ta`.

## 11. Sample MongoDB Queries
Executed in `queries.js`:
- Count temples in Kanchipuram (Result: 586)
- Find Top 3 categories per city via aggregation pipeline.
- Full-text search for places containing 'Ganesh'.

## 12. PostGIS ↔ MongoDB Integration Strategy
The architecture uses `osm_id` as the shared key. `consistency_check.js` connects to both PostgreSQL and MongoDB simultaneously, extracts all `osm_id`s from both databases, and verifies parity. The check returned 0 mismatches out of 17,023 records.

## 13. Problems Encountered
- `useNewUrlParser` and `useUnifiedTopology` connection options are obsolete in modern Mongoose (v7+), causing initial seed failure.
- User machine was initially missing MongoDB Community Server in the local environment PATH.

## 14. Solutions
- Updated `connection.js` to rely on Mongoose's default modern connection engine without legacy options.
- The user successfully started the local MongoDB instance on port `27017` before running the seeding operations.

## 15. Phase 3 Completion Status
**Fully Complete.** The "WHAT" data layer is established, populated, indexed, and proven to be 100% consistent with the spatial database layer.
