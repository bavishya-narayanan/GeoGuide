/**
 * Name Enrichment Script
 * ======================
 * Finds all places that have no name in the PostGIS spatial database,
 * fetches a real name from Nominatim (OpenStreetMap) reverse geocoding
 * using their coordinates, then updates:
 *   1. PostGIS `places_spatial` table  — name column
 *   2. MongoDB `places` collection     — name field
 *
 * Usage:
 *   node src/scripts/enrichNames.js
 *   node src/scripts/enrichNames.js --dry-run        (show what would change, no writes)
 *   node src/scripts/enrichNames.js --limit=50       (process only first 50 unnamed places)
 *   node src/scripts/enrichNames.js --batch-size=10  (log progress every N records)
 *   node src/scripts/enrichNames.js --skip-nominatim (use only smart fallbacks, fastest)
 *
 * When Nominatim is unreachable, the script auto-detects this and falls back
 * to smart name generation: e.g. "Park · Chennai", "Restaurant · Coimbatore".
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool }    = require('pg');
const https       = require('https');
const env         = require('../config/env');
const Place       = require('../../../database/mongodb/placeModel');
const { connectMongo, closeMongo } = require('../db/mongo');

// ── CLI flags ────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const SKIP_NOM   = args.includes('--skip-nominatim');
const limitIdx   = args.findIndex((a) => a.startsWith('--limit='));
const LIMIT      = limitIdx >= 0 ? Number(args[limitIdx].replace('--limit=', '')) : Infinity;
const batchIdx   = args.findIndex((a) => a.startsWith('--batch-size='));
const BATCH_SIZE = batchIdx >= 0 ? Number(args[batchIdx].replace('--batch-size=', '')) : 20;

// ── DB connections ───────────────────────────────────────────────────────────
const spatialPool = new Pool(env.spatial);

// ── Smart name generator ───────────────────────────────────────────────────
/**
 * Build a human-readable, informative name from operator, street, religion, category, and city.
 * Never outputs "Unnamed X".
 * Examples:
 *   operator="Canara Bank", category="ATM"        → "Canara Bank ATM · Chennai"
 *   religion="hindu", category="Temple"           → "Hindu Temple · Chennai"
 *   street="Anna Salai", category="Fuel Station"  → "Fuel Station · Anna Salai, Chennai"
 *   category="Park", city="Chennai"               → "Park · Chennai"
 */
function buildSmartName(row) {
    const category = row.category || 'Place';
    const readableCategory = category
        ? category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')
        : 'Place';
    const city = row.city && row.city.trim() ? row.city.trim() : null;
    const operator = row.operator && row.operator.trim() ? row.operator.trim() : null;
    const street = (row.addr_street || row.street) && (row.addr_street || row.street).trim()
        ? (row.addr_street || row.street).trim()
        : null;
    const religion = row.religion && row.religion.trim() ? row.religion.trim() : null;

    if (operator) {
        const opLower = operator.toLowerCase();
        const catLower = readableCategory.toLowerCase();
        const namePart = opLower.includes(catLower) ? operator : `${operator} ${readableCategory}`;
        if (street && city) return `${namePart} · ${street}, ${city}`;
        if (street) return `${namePart} · ${street}`;
        return city ? `${namePart} · ${city}` : namePart;
    }

    if (religion && (readableCategory.toLowerCase().includes('temple') || readableCategory.toLowerCase().includes('religious') || readableCategory.toLowerCase().includes('worship'))) {
        const relTitle = religion.charAt(0).toUpperCase() + religion.slice(1);
        const namePart = `${relTitle} ${readableCategory}`;
        if (street && city) return `${namePart} · ${street}, ${city}`;
        if (street) return `${namePart} · ${street}`;
        return city ? `${namePart} · ${city}` : namePart;
    }

    if (street) {
        return city ? `${readableCategory} · ${street}, ${city}` : `${readableCategory} · ${street}`;
    }

    return city ? `${readableCategory} · ${city}` : readableCategory;
}

// ── Nominatim probe ──────────────────────────────────────────────────────────
/** Low-level HTTP GET returning the raw response body (no error swallowing). */
function rawGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'GeoGuide/1.0 (educational project)',
                'Accept': 'application/json'
            },
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

/** Returns true only if Nominatim returns valid JSON (not an access-denied page). */
async function checkNominatim() {
    try {
        const { body } = await rawGet(
            'https://nominatim.openstreetmap.org/reverse?lat=13.0827&lon=80.2707&format=json&zoom=18'
        );
        JSON.parse(body); // throws if not valid JSON (e.g. "Access denied" HTML/text)
        return true;
    } catch {
        return false;
    }
}

/** Rate-limited reverse geocode — 1 req/s. Returns { name, street, city } or null. */
let lastNomTime = 0;
async function reverseGeocode(lat, lon) {
    const wait = 1050 - (Date.now() - lastNomTime);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastNomTime = Date.now();

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`;
        const { body } = await rawGet(url);
        const data = JSON.parse(body);
        if (!data || data.error) return null;

        const addr = data.address || {};
        const nameCandidates = [
            addr.amenity, addr.tourism, addr.leisure, addr.historic,
            addr.shop, addr.building, addr.neighbourhood, addr.suburb
        ];
        const name   = nameCandidates.find((v) => v && v.trim()) || null;
        const street = addr.road || addr.pedestrian || addr.footway || null;
        const city   = addr.city || addr.town || addr.village || addr.county || null;
        return { name, street, city };
    } catch {
        return null;
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`  GeoGuide — Name Enrichment Script`);
    console.log(`  Mode      : ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
    console.log(`  Limit     : ${isFinite(LIMIT) ? LIMIT : 'all'}`);
    console.log(`  Nominatim : ${SKIP_NOM ? 'skipped (--skip-nominatim)' : 'will probe'}`);
    console.log(`═══════════════════════════════════════\n`);

    // Connect databases
    await connectMongo();
    console.log('✔  Connected to MongoDB');
    await spatialPool.query('SELECT 1');
    console.log('✔  Connected to PostGIS\n');

    // Fetch unnamed rows
    const { rows: unnamedRows } = await spatialPool.query(`
        SELECT osm_id, name, category, city, lat, lon, operator, addr_street, addr_city, amenity, religion
        FROM   places_spatial
        WHERE  (name IS NULL OR trim(name) = '' OR lower(name) LIKE 'unnamed%')
        ORDER  BY osm_id
        LIMIT  $1
    `, [isFinite(LIMIT) ? LIMIT : 999999]);

    console.log(`Found ${unnamedRows.length} unnamed place(s) in PostGIS.\n`);

    if (unnamedRows.length === 0) {
        console.log('✅ All places already have names!');
        await cleanup();
        return;
    }

    // Check Nominatim only once
    let nominatimAvailable = false;
    if (!SKIP_NOM && !DRY_RUN) {
        console.log('Probing Nominatim...');
        nominatimAvailable = await checkNominatim();
        console.log(nominatimAvailable
            ? '✔  Nominatim reachable — will use reverse geocoding.\n'
            : '⚠  Nominatim blocked — using smart names (Operator / Street / Category · City).\n'
        );
    } else {
        console.log('⚠  Skipping Nominatim — using smart names (Operator / Street / Category · City).\n');
    }

    let updated = 0, nominatimHit = 0, fallback = 0, failed = 0;
    const mongoBatch = [];

    for (let i = 0; i < unnamedRows.length; i++) {
        const row = unnamedRows[i];

        if (i > 0 && i % 250 === 0) {
            console.log(`[${i}/${unnamedRows.length}] Processed...`);
        }

        let resolvedName   = null;
        let resolvedStreet = null;
        let resolvedCity   = null;

        if (nominatimAvailable) {
            const geo = await reverseGeocode(Number(row.lat), Number(row.lon));
            if (geo) {
                resolvedName   = geo.name;
                resolvedStreet = geo.street;
                resolvedCity   = geo.city;
            }
        }

        // Smart name resolution when Nominatim gave no name
        if (!resolvedName) {
            resolvedName = buildSmartName({
                ...row,
                addr_street: resolvedStreet || row.addr_street,
                city: resolvedCity || row.city
            });
            fallback++;
        } else {
            nominatimHit++;
        }

        if (i < 15 || i % 100 === 0) {
            console.log(`  [${row.osm_id}] ${row.category}@${row.city}  →  "${resolvedName}"`);
        }

        if (DRY_RUN) { updated++; continue; }

        // Update PostGIS
        try {
            await spatialPool.query(
                `UPDATE places_spatial SET name = $1 WHERE osm_id = $2 AND (name IS NULL OR trim(name) = '' OR lower(name) LIKE 'unnamed%')`,
                [resolvedName, Number(row.osm_id)]
            );
        } catch (err) {
            console.error(`  ✖ PostGIS error for osm_id=${row.osm_id}:`, err.message);
            failed++;
            continue;
        }

        // Queue MongoDB update
        const mongoUpdate = { $set: { name: resolvedName } };
        if (resolvedStreet) mongoUpdate.$set['address.street'] = resolvedStreet;
        if (resolvedCity)   mongoUpdate.$set['address.city']   = resolvedCity;
        mongoBatch.push({
            updateOne: {
                filter: { osm_id: Number(row.osm_id) },
                update: mongoUpdate
            }
        });

        // Flush MongoDB batch every 100 records
        if (mongoBatch.length >= 100) {
            try {
                await Place.bulkWrite(mongoBatch.splice(0, mongoBatch.length));
            } catch (err) {
                console.error(`  ✖ MongoDB bulkWrite error:`, err.message);
            }
        }

        updated++;
    }

    // Flush any remaining MongoDB updates
    if (mongoBatch.length > 0) {
        try {
            await Place.bulkWrite(mongoBatch);
        } catch (err) {
            console.error(`  ✖ MongoDB bulkWrite error:`, err.message);
        }
    }

    // Summary
    console.log(`\n═══════════════════════════════════════`);
    console.log(`  Results`);
    console.log(`─────────────────────────────────────`);
    console.log(`  Total unnamed   : ${unnamedRows.length}`);
    console.log(`  Nominatim hits  : ${nominatimHit}`);
    console.log(`  Smart fallbacks : ${fallback}`);
    console.log(`  Updated         : ${updated}${DRY_RUN ? ' (dry run — no writes)' : ''}`);
    console.log(`  Errors          : ${failed}`);
    console.log(`═══════════════════════════════════════\n`);

    await cleanup();
}

async function cleanup() {
    try { await spatialPool.end(); } catch { /* ignore */ }
    try { await closeMongo(); } catch { /* ignore */ }
    console.log('Connections closed. Done.');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
