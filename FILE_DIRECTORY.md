# GeoGuide — Project File Directory & Purpose Specification

This document provides a comprehensive inventory and functional specification for every file in the **GeoGuide** repository. GeoGuide is a multi-database, full-stack spatial discovery and exploration platform featuring PostgreSQL/PostGIS (spatial search), MongoDB (rich place attributes), PostgreSQL (user data & authentication), an Express.js backend, and a React + Vite frontend.

---

## Table of Contents
1. [Root Configuration & Documentation](#1-root-configuration--documentation)
2. [Project Phase Reports](#2-project-phase-reports)
3. [Backend Service (`backend/`)](#3-backend-service-backend)
   - [Config & Database Connections](#config--database-connections)
   - [Middleware](#middleware)
   - [Routes & API Endpoints](#routes--api-endpoints)
   - [Services & Business Logic](#services--business-logic)
   - [Scripts & Maintenance](#scripts--maintenance)
4. [Database Systems (`database/`)](#4-database-systems-database)
   - [PostGIS Spatial Database (`database/postgis/`)](#postgis-spatial-database-databasepostgis)
   - [MongoDB Document Store (`database/mongodb/`)](#mongodb-document-store-databasemongodb)
   - [PostgreSQL User Database (`database/users/`)](#postgresql-user-database-databaseusers)
5. [Dataset Pipeline (`dataset/`)](#5-dataset-pipeline-dataset)
   - [Data Files](#data-files)
   - [Python Processing Scripts (`dataset/scripts/`)](#python-processing-scripts-datasetscripts)
6. [Frontend Application (`frontend/`)](#6-frontend-application-frontend)
   - [Build & Configuration](#build--configuration)
   - [Application Entry Points & Styles](#application-entry-points--styles)
   - [State Management (`context/`)](#state-management-context)
   - [Reusable UI Components (`components/`)](#reusable-ui-components-components)
   - [Pages (`pages/`)](#pages-pages)
   - [API Client & Browser Services (`services/`)](#api-client--browser-services-services)
7. [Documentation (`docs/`)](#7-documentation-docs)

---

## 1. Root Configuration & Documentation

| File Path | Purpose |
|:---|:---|
| [`.env`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/.env) | **Active Environment Configuration**: Stores environment secrets and connection parameters for local development, including credentials and ports for PostGIS (`SPATIAL_DB_*`), User PostgreSQL (`USER_DB_*`), MongoDB (`MONGODB_URI`), JWT signing secret, and server port. |
| [`.env.example`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/.env.example) | **Environment Variable Template**: Documents the required environment keys, defaults, and format without exposing production secrets. |
| [`.gitignore`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/.gitignore) | **Git Ignore Rules**: Excludes transient artifacts, environment files (`.env`), build outputs (`dist/`), dependencies (`node_modules/`), and OS temporary files from version control. |
| [`package-lock.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/package-lock.json) | **Root Dependency Lockfile**: Records exact dependency tree resolutions for any workspace-level npm packages. |

---

## 2. Project Phase Reports

These markdown files document the iterative development, implementation evidence, schema designs, test outputs, and security validations across all phases of the project:

| File Path | Purpose |
|:---|:---|
| [`phase3_mongodb_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase3_mongodb_report.md) | **MongoDB Layer Report**: Details the schema design, JSON/BSON import validation, index creation (compound and text indexes), and query performance for place enrichment data. |
| [`phase4_user_database_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase4_user_database_report.md) | **User PostgreSQL Report**: Documents relational schemas for users, saved favorites, ratings, reviews, search history, and category preferences with foreign key integrity. |
| [`phase5_integration_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase5_integration_report.md) | **Three-Database Integration Report**: Validates cross-database ID consistency, cross-system joins (PostGIS spatial rows + MongoDB metadata + PostgreSQL user interactions), and query orchestration. |
| [`phase6_frontend_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase6_frontend_report.md) | **Initial Frontend Architecture Report**: Details the React component hierarchy, theme, responsive layouts, routing, and initial view implementations. |
| [`phase7a_location_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase7a_location_report.md) | **Location & Search Services Report**: Covers geolocation detection, coordinate fallback strategies, city boundary definitions, and radius-based place queries. |
| [`phase7b_map_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase7b_map_report.md) | **Interactive Map Integration Report**: Documents Leaflet/React-Leaflet map integration, marker clustering, popups, radius circles, and dynamic viewport bounds fitting. |
| [`phase8_advanced_search_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase8_advanced_search_report.md) | **Advanced Search & Filtering Report**: Details multi-criteria search combining keyword text search, city filtering, category filtering, radius bounding, and sorting algorithms. |
| [`phase9_authentication_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase9_authentication_report.md) | **Authentication & Security Report**: Documents password hashing with bcrypt, JWT token issuing/verification, auth middleware, and protected user routes. |
| [`phase10_user_interaction_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase10_user_interaction_report.md) | **User Interaction Report**: Covers CRUD operations for ratings (1-5 stars), text reviews, bookmarking favorites, and tracking recent user searches. |
| [`phase11_completion_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase11_completion_report.md) | **Phase 11 Comprehensive Verification**: High-level completion report validating all functional requirements across frontend, backend, and database tiers. |
| [`phase11_database_testing.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase11_database_testing.md) | **Database Testing Log**: Contains automated query test suites verifying PostGIS spatial operations, MongoDB document lookups, and PostgreSQL constraint checks. |
| [`phase11_performance_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase11_performance_report.md) | **Performance Benchmarks**: Analyzes database index usage (`EXPLAIN ANALYZE`), API latency, pagination scalability, and frontend asset bundle sizes. |
| [`phase11_security_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase11_security_report.md) | **Security Audit**: Documents SQL injection prevention, parameterized queries, Helmet security headers, rate limiting policies, and token expiration handling. |
| [`phase12_final_completion_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/phase12_final_completion_report.md) | **Final Project Wrap-up Report**: Comprehensive executive summary certifying system readiness, end-to-end user workflows, and architectural adherence. |

---

## 3. Backend Service (`backend/`)

The backend is built with Express.js, connecting to PostGIS, MongoDB, and PostgreSQL databases to provide RESTful APIs.

### Root Files & Package Configuration
| File Path | Purpose |
|:---|:---|
| [`backend/package.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/package.json) | **Backend Manifest**: Defines package scripts (`start`, `dev`, `enrich:names`, `sync:names`), metadata, and dependencies (`express`, `pg`, `mongoose`, `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `express-rate-limit`). |
| [`backend/package-lock.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/package-lock.json) | **Backend Dependency Lockfile**: Locks specific versions and sub-dependencies for the backend environment. |
| [`backend/src/server.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/server.js) | **Backend Entry Point**: Initializes the Express app, mounts global middleware (CORS, Helmet, JSON parser, rate limiters), registers API route handlers, connects all 3 databases, verifies health checks, and starts the HTTP server. |

### Config & Database Connections
| File Path | Purpose |
|:---|:---|
| [`backend/src/config/env.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/config/env.js) | **Central Configuration Loader**: Reads process environment variables from `.env`, validates database credentials, sets defaults for ports, timeouts, and JWT secrets, and exports structured configuration objects. |
| [`backend/src/db/spatial.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/db/spatial.js) | **PostGIS Connection Pool**: Creates and exports a PostgreSQL `Pool` instance configured for the `geoguide_spatial` database, along with connectivity health checks. |
| [`backend/src/db/mongo.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/db/mongo.js) | **MongoDB Connection Handler**: Connects Mongoose to the MongoDB cluster using the shared Mongoose base instance from `placeModel.js`, handling connection pooling, ping health checks, and graceful shutdown. |
| [`backend/src/db/users.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/db/users.js) | **User PostgreSQL Connection Pool**: Creates and exports a PostgreSQL `Pool` instance connected to `geoguide_users` for user accounts, reviews, ratings, favorites, and search history. |

### Middleware
| File Path | Purpose |
|:---|:---|
| [`backend/src/middleware/authMiddleware.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/middleware/authMiddleware.js) | **Authentication & Authorization**: Validates incoming `Authorization: Bearer <token>` JWT headers. Includes both `requireAuth` (strict enforcement) and `optionalAuth` (extracts user ID if token is provided without rejecting unauthenticated requests). |
| [`backend/src/middleware/errorHandler.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/middleware/errorHandler.js) | **Central Error Handler**: Catches unhandled exceptions and rejected promises, logs error details, sanitizes database errors to prevent data leaks, and sends uniform JSON error responses with appropriate HTTP status codes. |
| [`backend/src/middleware/rateLimiters.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/middleware/rateLimiters.js) | **API Rate Limiting**: Implements memory-based IP rate limiters using `express-rate-limit` to protect public endpoints and auth routes against brute-force and denial-of-service attempts. |

### Routes & API Endpoints
| File Path | Purpose |
|:---|:---|
| [`backend/src/routes/auth.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/routes/auth.js) | **Authentication Routes**: Provides endpoints for user registration (`POST /api/auth/register`), login (`POST /api/auth/login`), profile retrieval (`GET /api/auth/me`), profile updates (`PUT /api/auth/profile`), and password change. |
| [`backend/src/routes/places.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/routes/places.js) | **Places & Search Routes**: Handles spatial search queries (`GET /api/places/search`), individual place details (`GET /api/places/:id`), place rating aggregation, reviews, and bookmarking. |
| [`backend/src/routes/reviews.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/routes/reviews.js) | **Standalone Review Routes**: Exposes endpoints to edit (`PUT /api/reviews/:id`) and remove (`DELETE /api/reviews/:id`) user-submitted reviews. |
| [`backend/src/routes/users.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/routes/users.js) | **User Profile & Activity Routes**: Handles user favorites list (`GET /api/users/me/favorites`), user review history, rating history, recent search history, and category preference updates. |

### Services & Business Logic
| File Path | Purpose |
|:---|:---|
| [`backend/src/services/authService.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/services/authService.js) | **Authentication Service**: Handles password encryption/comparison using bcrypt, issues and verifies signed JWT tokens, and manages token expiry rules. |
| [`backend/src/services/spatialService.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/services/spatialService.js) | **PostGIS Spatial Logic**: Constructs and executes optimized SQL queries using `ST_DWithin`, `ST_Distance`, and geometry sphere calculations for nearest-neighbor, radial, bounding box, and category searches. |
| [`backend/src/services/placeService.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/services/placeService.js) | **MongoDB Place Service**: Performs bulk lookups (`find({ osm_id: { $in } })`) and full-text searches using MongoDB text indexes to retrieve enriched place attributes, contact details, and facilities. |
| [`backend/src/services/searchService.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/services/searchService.js) | **Unified Search Aggregator**: Merges spatial records from PostGIS with document attributes from MongoDB and personalized user interaction state (ratings, favorites, reviews) from PostgreSQL. Ensures clean display names. |
| [`backend/src/services/userService.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/services/userService.js) | **User Management Service**: Implements business logic for managing user accounts, storing/deleting favorites, creating and updating star ratings, persisting review texts, and logging search queries. |
| [`backend/src/services/nominatimService.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/services/nominatimService.js) | **External Geocoding Service**: Provides rate-limited HTTP client functionality to reverse-geocode coordinates against OpenStreetMap Nominatim when needed for address enrichment. |

### Scripts & Maintenance
| File Path | Purpose |
|:---|:---|
| [`backend/src/scripts/enrichNames.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/scripts/enrichNames.js) | **Batch Name Enrichment Script**: Detects unnamed places (`name IS NULL` or empty), enriches them with operator names, street addresses, religion labels, or category/city fallbacks, and writes updates to both PostGIS and MongoDB. |
| [`backend/src/scripts/syncMongoNames.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/backend/src/scripts/syncMongoNames.js) | **Database Synchronization Script**: Scans MongoDB for documents missing names or carrying placeholder text and synchronizes their names directly from corresponding PostGIS records using bulk write operations. |

---

## 4. Database Systems (`database/`)

### PostGIS Spatial Database (`database/postgis/`)
| File Path | Purpose |
|:---|:---|
| [`database/postgis/schema.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/postgis/schema.sql) | **PostGIS DDL Schema**: Defines the `places_spatial` table structure with spatial geometry column `geom GEOMETRY(Point, 4326)`, GIST spatial indexing, attribute columns, and spatial constraints. |
| [`database/postgis/import.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/postgis/import.sql) | **Data Ingestion Script**: Loads extracted POI CSV/GeoJSON datasets into `places_spatial`, creating point geometries from latitude and longitude coordinates. |
| [`database/postgis/spatial_queries.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/postgis/spatial_queries.sql) | **Query Library & Benchmarks**: Contains reference queries for radius-based proximity filtering (`ST_DWithin`), KNN distance sorting (`<->`), and bounding-box queries for map viewports. |
| [`database/postgis/validation.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/postgis/validation.sql) | **Spatial Data Validation**: SQL verification scripts testing geometry validity (`ST_IsValid`), coordinate bounding sanity checks, null constraint validations, and spatial index usage. |
| [`database/postgis/README.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/postgis/README.md) | **PostGIS Documentation**: Setup instructions, prerequisites, database creation commands, and schema documentation for the spatial database. |

### MongoDB Document Store (`database/mongodb/`)
| File Path | Purpose |
|:---|:---|
| [`database/mongodb/placeModel.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/placeModel.js) | **Mongoose Schema & Model**: Defines the `Place` schema, specifying indexed `osm_id`, category, city, address details, contact info, operating hours, opening hours, facilities, compound indexes, and text indexes. |
| [`database/mongodb/connection.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/connection.js) | **Standalone MongoDB Connection**: Utility for CLI scripts and seeding tasks to establish and close connections to the MongoDB database. |
| [`database/mongodb/seed.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/seed.js) | **MongoDB Seeding Script**: Reads processed POI GeoJSON/CSV files and performs batch upserts into the MongoDB `places` collection. |
| [`database/mongodb/queries.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/queries.js) | **MongoDB Query Examples**: Example scripts demonstrating text queries, category filtering, attribute aggregation, and lean document retrieval. |
| [`database/mongodb/consistency_check.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/consistency_check.js) | **Data Cross-Check Script**: Compares document IDs in MongoDB against records in PostGIS to verify 1:1 ID parity, detecting orphaned records. |
| [`database/mongodb/package.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/package.json) | **MongoDB Package Manifest**: Defines scripts (`seed`, `check`, `test`) and dependencies (`mongoose`, `dotenv`) for database maintenance tasks. |
| [`database/mongodb/package-lock.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/package-lock.json) | **MongoDB Lockfile**: Dependency lockfile for the database migration tools. |
| [`database/mongodb/.env`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/.env) | **MongoDB Local Environment**: Local connection string configuration for database maintenance tasks. |
| [`database/mongodb/.env.example`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/.env.example) | **MongoDB Environment Template**: Example connection strings for MongoDB seeding and verification. |
| [`database/mongodb/category_mapping.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/category_mapping.md) | **Taxonomy Documentation**: Maps raw OSM tags (`amenity=*`, `tourism=*`, `leisure=*`, `shop=*`) to standardized GeoGuide categories. |
| [`database/mongodb/validation_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/validation_report.md) | **MongoDB Verification Report**: Verification logs documenting successful seeding, document counts, and index validations. |
| [`database/mongodb/postgis_mongodb_consistency.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/postgis_mongodb_consistency.md) | **Cross-Database Audit Log**: Records the parity verification between PostGIS `places_spatial` and MongoDB `places` collections. |
| [`database/mongodb/README.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/mongodb/README.md) | **MongoDB Setup Guide**: Overview of document schema, installation, index creation, and seeding instructions. |

### PostgreSQL User Database (`database/users/`)
| File Path | Purpose |
|:---|:---|
| [`database/users/schema.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/users/schema.sql) | **User Database DDL**: Creates relational tables: `users` (accounts, bcrypt passwords), `favorites` (bookmarked places), `ratings` (1-5 star reviews), `reviews` (review commentary), `search_history`, and `user_preferences`. |
| [`database/users/connection.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/users/connection.js) | **Standalone User DB Connection**: Connection helper for running migrations and running validation scripts against the `geoguide_users` database. |
| [`database/users/test_queries.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/users/test_queries.sql) | **User DB Test Suite**: SQL queries testing user creation, duplicate email constraints, favorite toggles, rating updates, and cascade delete behavior. |
| [`database/users/validation.sql`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/users/validation.sql) | **User Integrity Validation**: Integrity check scripts verifying table existence, foreign keys, unique indexes, and check constraints (e.g., rating between 1 and 5). |
| [`database/users/README.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/users/README.md) | **User Database Guide**: Schema entity-relationship documentation, setup instructions, and database configuration guidance. |

### Integration Documentation
| File Path | Purpose |
|:---|:---|
| [`database/integration_validation.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/database/integration_validation.md) | **System Integration Log**: Documents multi-database query tests joining PostGIS spatial coordinates, MongoDB document metadata, and PostgreSQL user data. |

---

## 5. Dataset Pipeline (`dataset/`)

The dataset pipeline ingests raw OpenStreetMap extracts, parses features for Chennai, Kanchipuram, and Madurai, normalizes taxonomies, and outputs clean files for database ingestion.

### Data Files
| File Path | Purpose |
|:---|:---|
| [`dataset/tamil_nadu.pbf`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/tamil_nadu.pbf) | **Raw OpenStreetMap Protocolbuffer**: Source OpenStreetMap geospatial data extract for Tamil Nadu. |
| [`dataset/processed/geoguide_pois.csv`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/processed/geoguide_pois.csv) | **Unified CSV Dataset**: Cleaned, categorized table of points of interest across Chennai, Kanchipuram, and Madurai ready for PostGIS `COPY` import. |
| [`dataset/processed/chennai_pois.geojson`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/processed/chennai_pois.geojson) | **Chennai GeoJSON**: Extracted points of interest located within the Chennai metropolitan boundary. |
| [`dataset/processed/kanchipuram_pois.geojson`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/processed/kanchipuram_pois.geojson) | **Kanchipuram GeoJSON**: Extracted points of interest for Kanchipuram. |
| [`dataset/processed/madurai_pois.geojson`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/processed/madurai_pois.geojson) | **Madurai GeoJSON**: Extracted points of interest for Madurai. |
| [`dataset/phase1_dataset_report.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/phase1_dataset_report.md) | **Extraction Phase Report**: Documents dataset sourcing, extraction statistics, POI category distribution, and normalization rules. |

### Python Processing Scripts (`dataset/scripts/`)
| File Path | Purpose |
|:---|:---|
| [`dataset/scripts/phase1_extract.py`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/phase1_extract.py) | **OSM Extraction Script**: Parses `tamil_nadu.pbf` using `osmium`, filters POIs within predefined city bounding boxes, extracts tags, assigns standardized categories, and outputs GeoJSON/CSV. |
| [`dataset/scripts/phase1_inspect.py`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/phase1_inspect.py) | **Data Inspection Utility**: Generates statistical breakdowns of extracted POIs, tag completeness (names, streets, contact info), and category distribution. |
| [`dataset/scripts/phase1_validate.py`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/phase1_validate.py) | **Data Quality Validator**: Checks dataset integrity, verifies coordinate ranges (lat/lon within Tamil Nadu), flags null attributes, and validates GeoJSON syntax. |
| [`dataset/scripts/phase1_report.py`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/phase1_report.py) | **Report Generator**: Automatically aggregates extraction metrics and validation results into markdown reports. |
| [`dataset/scripts/phase1_run_all.py`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/phase1_run_all.py) | **Pipeline Orchestrator**: Runs the complete dataset extraction, validation, inspection, and report generation pipeline in sequence. |
| [`dataset/scripts/extract_summary.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/extract_summary.json) | **Extraction Summary Metrics**: Machine-readable JSON summary of extracted records per city and category. |
| [`dataset/scripts/inspect_stats.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/inspect_stats.json) | **Inspection Statistics**: Machine-readable JSON metrics on field coverage and tag availability. |
| [`dataset/scripts/validation_results.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/dataset/scripts/validation_results.json) | **Validation Test Results**: Automated assertion results checking schema compliance and geometry validity. |

---

## 6. Frontend Application (`frontend/`)

The frontend is a single-page React application built with Vite, React Router, Leaflet, and modern CSS.

### Build & Configuration
| File Path | Purpose |
|:---|:---|
| [`frontend/package.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/package.json) | **Frontend Manifest**: Declares build scripts (`dev`, `build`, `preview`), dependencies (`react`, `react-dom`, `react-router-dom`, `leaflet`, `react-leaflet`, `axios`, `lucide-react`), and devDependencies. |
| [`frontend/package-lock.json`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/package-lock.json) | **Frontend Lockfile**: Locks package and sub-dependency versions for the frontend build. |
| [`frontend/vite.config.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/vite.config.js) | **Vite Configuration**: Configures Vite plugins (React Fast Refresh), development server port, and build optimizations. |
| [`frontend/index.html`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/index.html) | **HTML Template**: Application entry HTML hosting root container `<div id="root"></div>`, meta tags, and font stylesheets. |
| [`frontend/.env.example`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/.env.example) | **Frontend Environment Template**: Documents client environment variables (e.g., `VITE_API_BASE_URL`). |
| [`frontend/README.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/README.md) | **Frontend Guide**: Setup, local development instructions, and UI architectural overview. |

### Application Entry Points & Styles
| File Path | Purpose |
|:---|:---|
| [`frontend/src/main.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/main.jsx) | **Client Bootstrapper**: Mounts the React component tree into the DOM root wrapped with `BrowserRouter` and `UserProvider`. |
| [`frontend/src/App.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/App.jsx) | **Root Component & Router**: Configures application layout, header navigation, route definitions (`/`, `/search`, `/places/:id`, `/login`, `/register`, `/favorites`, `/history`, `/my-reviews`, `/profile`), and 404 handler. |
| [`frontend/src/index.css`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/index.css) | **Global Stylesheet**: Defines CSS variables, color tokens, typography, glassmorphism effects, responsive flexbox/grid layouts, card styles, and Leaflet map overrides. |

### State Management (`context/`)
| File Path | Purpose |
|:---|:---|
| [`frontend/src/context/UserContext.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/context/UserContext.jsx) | **User Context & Session State**: React Context provider managing user authentication state, current user profile, JWT token persistence in `localStorage`, login, registration, and logout actions. |

### Reusable UI Components (`components/`)
| File Path | Purpose |
|:---|:---|
| [`frontend/src/components/Navbar.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/Navbar.jsx) | **Navigation Header**: Top navigation bar with logo, navigation links, mobile hamburger drawer, and conditional authentication buttons (Login / Profile / Logout). |
| [`frontend/src/components/GeoMap.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/GeoMap.jsx) | **Interactive Map Component**: Leaflet map component rendering user location marker, search radius circle, place markers, click-to-search handlers, and popup cards with clean place names. |
| [`frontend/src/components/PlaceCard.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/PlaceCard.jsx) | **Place Result Card**: Component displaying category, city, formatted title, address preview, distance badge, star rating summary, and favorite toggle button. |
| [`frontend/src/components/PlaceList.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/PlaceList.jsx) | **Place Card Collection**: Renders a list/grid of `PlaceCard` components, handling empty states and interactions. |
| [`frontend/src/components/SearchBar.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/SearchBar.jsx) | **Search Input Bar**: Search form with keyword input, search icon, clear button, and submit handler. |
| [`frontend/src/components/SearchFilters.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/SearchFilters.jsx) | **Search Filter Controls**: Dropdown selectors for city (Chennai, Kanchipuram, Madurai), category filter, search radius slider/dropdown, and sort order. |
| [`frontend/src/components/Rating.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/Rating.jsx) | **Star Rating Component**: Displays interactive 5-star rating inputs (for submitting ratings) or read-only star score displays with numeric averages. |
| [`frontend/src/components/FavoriteButton.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/FavoriteButton.jsx) | **Bookmark Toggle Button**: Heart-shaped button allowing authenticated users to add or remove places from their saved favorites. |
| [`frontend/src/components/Loading.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/Loading.jsx) | **Loading Spinner Indicator**: Consistent loading state component used during network fetches and page transitions. |
| [`frontend/src/components/ProtectedRoute.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/components/ProtectedRoute.jsx) | **Route Guard**: Wraps authenticated routes (`/profile`, `/favorites`, `/history`), redirecting unauthenticated users to `/login` with return state. |

### Pages (`pages/`)
| File Path | Purpose |
|:---|:---|
| [`frontend/src/pages/Home.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/Home.jsx) | **Homepage**: Landing page featuring hero search bar, city quick-links, popular category cards, personalized recommendations, and exploratory highlights. |
| [`frontend/src/pages/SearchResults.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/SearchResults.jsx) | **Search & Map Discovery Page**: Dual-pane interface with responsive split view: interactive Leaflet map on one side and filterable place result list on the other. |
| [`frontend/src/pages/PlaceDetails.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/PlaceDetails.jsx) | **Place Details Page**: Full view of a selected place, presenting complete contact info, operating hours, amenities, interactive map, user rating submissions, and review list. |
| [`frontend/src/pages/Favorites.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/Favorites.jsx) | **Saved Places Page**: Displays the authenticated user's bookmarked places with quick-access links and one-click removal. |
| [`frontend/src/pages/History.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/History.jsx) | **Search History Page**: Shows recent search terms, selected categories, and timestamps for the user, with one-click re-search and clear history options. |
| [`frontend/src/pages/MyReviews.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/MyReviews.jsx) | **User Reviews Management Page**: Lists all reviews and ratings submitted by the current user, allowing inline editing and deletion. |
| [`frontend/src/pages/Profile.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/Profile.jsx) | **User Profile Page**: Account dashboard displaying user info, preferred categories, account statistics, and profile update options. |
| [`frontend/src/pages/Login.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/Login.jsx) | **Login Page**: User sign-in form with email/password validation, error message display, and redirect after login. |
| [`frontend/src/pages/Register.jsx`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/pages/Register.jsx) | **Registration Page**: User registration form with client-side validation for name, email format, and password length. |

### API Client & Browser Services (`services/`)
| File Path | Purpose |
|:---|:---|
| [`frontend/src/services/api.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/services/api.js) | **Axios API Client**: Configured Axios instance with baseURL, request interceptors (attaches JWT bearer token), and response interceptors (handles 401 token expirations). Exposes API methods for all endpoints. |
| [`frontend/src/services/location.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/services/location.js) | **Browser Geolocation Service**: Wrapper around HTML5 `navigator.geolocation` API providing coordinates, error fallbacks, and city center coordinate mappings. |
| [`frontend/src/services/directions.js`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/frontend/src/services/directions.js) | **Navigation Helper**: Generates external navigation deep-links (Google Maps, OpenStreetMap) to get turn-by-turn driving or walking directions to a place. |

---

## 7. Documentation (`docs/`)

| File Path | Purpose |
|:---|:---|
| [`docs/api_testing.md`](file:///c:/Users/BAVISHYA/Desktop/GeoGuide/docs/api_testing.md) | **API Testing Guide**: cURL commands, test cases, and sample payloads for validating authentication, places search, reviews, and user preferences via terminal or Postman. |

---

*Generated for GeoGuide Architecture & Repository Maintenance.*
