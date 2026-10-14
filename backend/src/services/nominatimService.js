/**
 * Nominatim (OpenStreetMap) reverse geocoding service.
 * Nominatim's usage policy requires:
 *  - Max 1 request/second
 *  - A descriptive User-Agent
 *  - No bulk-querying in tight loops (hence the rate limiter below)
 * Docs: https://nominatim.org/release-docs/latest/api/Reverse/
 */

const https = require('https');

const USER_AGENT = 'GeoGuide/1.0 (educational project; contact: geoguide@example.com)';
const BASE_URL   = 'https://nominatim.openstreetmap.org/reverse';

// Simple token-bucket: 1 request per second (Nominatim ToS)
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1050; // slightly over 1 s for safety

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle() {
    const now = Date.now();
    const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
    if (wait > 0) await sleep(wait);
    lastRequestTime = Date.now();
}

/**
 * Fetch JSON from a URL with a custom User-Agent header.
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept':     'application/json'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (err) { reject(new Error(`JSON parse error: ${err.message}`)); }
            });
        }).on('error', reject);
    });
}

/**
 * Reverse-geocode a lat/lon to a human-readable place name.
 *
 * Returns the best available name string, or null if nothing useful found.
 *
 * Name resolution priority (best → fallback):
 *   1. display_name  —  full address label from Nominatim
 *   2. name from address parts (e.g. neighbourhood, suburb, road)
 *   3. null
 */
async function reverseGeocode(latitude, longitude) {
    await throttle();

    const url = `${BASE_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`;

    let data;
    try {
        data = await fetchJson(url);
    } catch (err) {
        console.warn(`[Nominatim] Request failed for (${latitude}, ${longitude}):`, err.message);
        return null;
    }

    if (!data || data.error) {
        return null;
    }

    // Try to build a meaningful short name from address parts
    const addr = data.address || {};

    // Preference order for a "place name" (most specific first)
    const nameCandidates = [
        addr.amenity,
        addr.tourism,
        addr.leisure,
        addr.historic,
        addr.shop,
        addr.building,
        addr.neighbourhood,
        addr.suburb,
        addr.village,
        addr.town,
        addr.city_district,
        addr.road
    ];

    const shortName = nameCandidates.find((v) => v && v.trim());
    return shortName || null;
}

/**
 * Reverse-geocode with a full structured address result.
 *
 * Returns { name, street, city } or null on failure.
 */
async function reverseGeocodeDetailed(latitude, longitude) {
    await throttle();

    const url = `${BASE_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`;

    let data;
    try {
        data = await fetchJson(url);
    } catch (err) {
        console.warn(`[Nominatim] Request failed for (${latitude}, ${longitude}):`, err.message);
        return null;
    }

    if (!data || data.error) return null;

    const addr = data.address || {};

    const nameCandidates = [
        addr.amenity,
        addr.tourism,
        addr.leisure,
        addr.historic,
        addr.shop,
        addr.building,
        addr.neighbourhood,
        addr.suburb
    ];

    const name   = nameCandidates.find((v) => v && v.trim()) || null;
    const street = addr.road || addr.pedestrian || addr.footway || null;
    const city   = addr.city || addr.town || addr.village || addr.county || null;

    return { name, street, city };
}

module.exports = { reverseGeocode, reverseGeocodeDetailed };
