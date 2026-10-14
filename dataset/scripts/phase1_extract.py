"""
Phase 1 – Tasks 2-6
Extract POIs for Chennai, Kanchipuram, Madurai from tamil_nadu.pbf.
Uses osmium (Python) for parsing + geopandas/shapely for spatial output.
"""

import osmium
import json
import os
import csv
import math
from collections import defaultdict

# ─── Paths ─────────────────────────────────────────────────────────────────
BASE   = os.path.join(os.path.dirname(__file__), "..")
PBF    = os.path.join(BASE, "tamil_nadu.pbf")
OUT    = os.path.join(BASE, "processed")
os.makedirs(OUT, exist_ok=True)

# ─── City bounding boxes (lon_min, lat_min, lon_max, lat_max) ──────────────
# These cover the full urban + metropolitan extents of each city.
CITY_BOXES = {
    "Chennai": {
        "lon_min": 79.9000, "lat_min": 12.7500,
        "lon_max": 80.3200, "lat_max": 13.2300,
    },
    "Kanchipuram": {
        "lon_min": 79.6200, "lat_min": 12.7800,
        "lon_max": 79.8000, "lat_max": 12.9000,
    },
    "Madurai": {
        "lon_min": 77.8500, "lat_min": 9.8000,
        "lon_max": 78.2000, "lat_max": 10.0500,
    },
}

def city_for_point(lat, lon):
    for city, bb in CITY_BOXES.items():
        if bb["lat_min"] <= lat <= bb["lat_max"] and bb["lon_min"] <= lon <= bb["lon_max"]:
            return city
    return None

# ─── POI category mapping ────────────────────────────────────────────────────
# Maps (tag_key, tag_value) → GeoGuide category label.
# '*' wildcard means any value for that key.
CATEGORY_MAP = [
    # Temples / Religious
    ("amenity",   "place_of_worship",  "Religious Place"),
    ("historic",  "temple",            "Temple"),
    ("historic",  "monastery",         "Religious Place"),
    # Restaurants / Food
    ("amenity",   "restaurant",        "Restaurant"),
    ("amenity",   "fast_food",         "Street Food / Fast Food"),
    ("amenity",   "food_court",        "Street Food / Fast Food"),
    ("amenity",   "cafe",              "Cafe"),
    ("amenity",   "bar",               "Bar / Pub"),
    ("amenity",   "biergarten",        "Bar / Pub"),
    ("amenity",   "ice_cream",         "Cafe"),
    ("amenity",   "juice_bar",         "Cafe"),
    # Shopping
    ("shop",      "*",                 "Shop"),
    ("amenity",   "marketplace",       "Market / Shopping"),
    ("amenity",   "shopping_mall",     "Market / Shopping"),
    # Hotels / Accommodation
    ("tourism",   "hotel",             "Hotel"),
    ("tourism",   "motel",             "Hotel"),
    ("tourism",   "hostel",            "Hotel"),
    ("tourism",   "guest_house",       "Hotel"),
    ("tourism",   "resort",            "Hotel"),
    ("tourism",   "apartment",         "Hotel"),
    # Hospitals / Healthcare
    ("amenity",   "hospital",          "Hospital"),
    ("amenity",   "clinic",            "Clinic / Healthcare"),
    ("amenity",   "doctors",           "Clinic / Healthcare"),
    ("amenity",   "dentist",           "Clinic / Healthcare"),
    ("amenity",   "pharmacy",          "Pharmacy"),
    ("amenity",   "veterinary",        "Veterinary"),
    ("healthcare","*",                 "Clinic / Healthcare"),
    # Tourist Attractions
    ("tourism",   "attraction",        "Tourist Attraction"),
    ("tourism",   "museum",            "Museum"),
    ("tourism",   "artwork",           "Tourist Attraction"),
    ("tourism",   "viewpoint",         "Tourist Attraction"),
    ("tourism",   "zoo",               "Tourist Attraction"),
    ("tourism",   "theme_park",        "Tourist Attraction"),
    ("historic",  "*",                 "Historic Site"),
    # Parks / Nature
    ("leisure",   "park",              "Park"),
    ("leisure",   "garden",            "Park"),
    ("leisure",   "nature_reserve",    "Park"),
    ("leisure",   "playground",        "Park"),
    ("leisure",   "stadium",           "Stadium / Sports"),
    ("leisure",   "sports_centre",     "Stadium / Sports"),
    ("leisure",   "swimming_pool",     "Stadium / Sports"),
    # Transport
    ("amenity",   "bus_station",       "Transport"),
    ("amenity",   "taxi",              "Transport"),
    ("amenity",   "fuel",              "Fuel Station"),
    ("amenity",   "parking",           "Parking"),
    ("railway",   "station",           "Transport"),
    ("railway",   "halt",              "Transport"),
    ("aeroway",   "aerodrome",         "Airport"),
    # Banks / ATMs
    ("amenity",   "bank",              "Bank"),
    ("amenity",   "atm",               "ATM"),
    ("amenity",   "bureau_de_change",  "Bank"),
    # Education
    ("amenity",   "school",            "School"),
    ("amenity",   "college",           "College / University"),
    ("amenity",   "university",        "College / University"),
    ("amenity",   "library",           "Library"),
    ("amenity",   "kindergarten",      "School"),
    # Other useful
    ("amenity",   "police",            "Police"),
    ("amenity",   "fire_station",      "Fire Station"),
    ("amenity",   "post_office",       "Post Office"),
    ("amenity",   "community_centre",  "Community Centre"),
    ("amenity",   "cinema",            "Cinema / Entertainment"),
    ("amenity",   "theatre",           "Cinema / Entertainment"),
    ("amenity",   "place_of_worship",  "Religious Place"),
]

def get_category(tags: dict) -> str | None:
    for key, val, label in CATEGORY_MAP:
        if key in tags:
            if val == "*" or tags[key] == val:
                return label
    return None

def get_religion(tags: dict) -> str:
    return tags.get("religion", "")

def clean_name(name: str) -> str:
    if not name:
        return ""
    return name.strip()

# ─── PASS 1: collect ways' centroids via node-location index ─────────────
# We use locations=True so osmium stores node coords for way processing.

class POIExtractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.pois = []           # list of dicts
        self.node_ids_seen = set()
        self.stats = defaultdict(lambda: defaultdict(int))

    def _make_poi(self, osm_id, osm_type, lat, lon, tags_dict):
        city = city_for_point(lat, lon)
        if city is None:
            return
        category = get_category(tags_dict)
        if category is None:
            return

        # Refine: if place_of_worship → use religion sub-tag
        if category == "Religious Place":
            religion = tags_dict.get("religion", "").lower()
            if religion == "hindu":
                category = "Temple"
            elif religion == "christian":
                category = "Church"
            elif religion == "muslim" or religion == "islam":
                category = "Mosque"
            elif religion == "jain":
                category = "Jain Temple"
            elif religion == "sikh":
                category = "Gurudwara"
            elif religion == "buddhist" or religion == "buddhism":
                category = "Buddhist Temple"
            else:
                category = "Religious Place"

        name    = clean_name(tags_dict.get("name", ""))
        name_en = clean_name(tags_dict.get("name:en", ""))
        name_ta = clean_name(tags_dict.get("name:ta", ""))

        poi = {
            "osm_id":    osm_id,
            "osm_type":  osm_type,
            "city":      city,
            "category":  category,
            "name":      name,
            "name_en":   name_en,
            "name_ta":   name_ta,
            "lat":       round(lat, 7),
            "lon":       round(lon, 7),
            # Extra useful tags
            "amenity":   tags_dict.get("amenity", ""),
            "tourism":   tags_dict.get("tourism", ""),
            "shop":      tags_dict.get("shop", ""),
            "leisure":   tags_dict.get("leisure", ""),
            "historic":  tags_dict.get("historic", ""),
            "healthcare":tags_dict.get("healthcare", ""),
            "railway":   tags_dict.get("railway", ""),
            "aeroway":   tags_dict.get("aeroway", ""),
            "religion":  tags_dict.get("religion", ""),
            "operator":  tags_dict.get("operator", ""),
            "opening_hours": tags_dict.get("opening_hours", ""),
            "phone":     tags_dict.get("phone", ""),
            "website":   tags_dict.get("website", ""),
            "addr_street": tags_dict.get("addr:street", ""),
            "addr_city":   tags_dict.get("addr:city", ""),
        }
        self.pois.append(poi)
        self.stats[city][category] += 1

    def node(self, n):
        if not n.location.valid():
            return
        tags = {t.k: t.v for t in n.tags}
        self._make_poi(n.id, "node", n.location.lat, n.location.lon, tags)

    def way(self, w):
        tags = {t.k: t.v for t in w.tags}
        if get_category(tags) is None:
            return
        # Compute centroid from node refs (osmium fills locations when locations=True)
        lats, lons = [], []
        for nd in w.nodes:
            if nd.location.valid():
                lats.append(nd.location.lat)
                lons.append(nd.location.lon)
        if not lats:
            return
        lat = sum(lats) / len(lats)
        lon = sum(lons) / len(lons)
        self._make_poi(w.id, "way", lat, lon, tags)

    def relation(self, r):
        # Relations: use first member's location if available (rough approximation)
        tags = {t.k: t.v for t in r.tags}
        if get_category(tags) is None:
            return
        # We'll skip relations that lack a dedicated centroid tag
        # Many named places have a label node — skip for now to avoid bad coords
        pass


print("=" * 60)
print("Phase 1 – Tasks 2-6: Extract, Clean, Export")
print("=" * 60)
print("Parsing PBF with node locations (this takes a few minutes)...")

h = POIExtractor()
h.apply_file(PBF, locations=True, idx="flex_mem")

print(f"\nRaw POIs extracted (before dedup): {len(h.pois):,}")

# ─── Deduplication ─────────────────────────────────────────────────────────
# Remove exact coordinate+name duplicates (same physical place tagged on both
# a node AND a way centroid landing within ~10m of each other).
def round_coord(v, decimals=4):
    return round(v, decimals)

seen = set()
deduped = []
dup_count = 0

for p in h.pois:
    key = (p["city"], round_coord(p["lat"]), round_coord(p["lon"]),
           p["name"].lower() if p["name"] else p["osm_type"] + str(p["osm_id"]))
    if key in seen:
        dup_count += 1
    else:
        seen.add(key)
        deduped.append(p)

print(f"Duplicates removed          : {dup_count:,}")
print(f"POIs after dedup            : {len(deduped):,}")

# ─── Quality stats ──────────────────────────────────────────────────────────
missing_name   = sum(1 for p in deduped if not p["name"])
invalid_geom   = 0  # All have coords (we filtered above)

print(f"Records missing name        : {missing_name:,}")
print(f"Records with invalid geom   : {invalid_geom}")

# ─── Split by city ──────────────────────────────────────────────────────────
by_city = defaultdict(list)
for p in deduped:
    by_city[p["city"]].append(p)

for city, pois in by_city.items():
    print(f"  {city}: {len(pois):,} POIs")

# ─── Write GeoJSON per city ──────────────────────────────────────────────────
def to_geojson(pois):
    features = []
    for p in pois:
        feat = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [p["lon"], p["lat"]]
            },
            "properties": {k: v for k, v in p.items() if k not in ("lat", "lon")}
        }
        features.append(feat)
    return {"type": "FeatureCollection", "features": features}

for city in ["Chennai", "Kanchipuram", "Madurai"]:
    pois = by_city.get(city, [])
    fname = f"{city.lower()}_pois.geojson"
    fpath = os.path.join(OUT, fname)
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(to_geojson(pois), f, ensure_ascii=False, indent=2)
    print(f"Written: {fpath}  ({len(pois):,} features)")

# ─── Write combined CSV ──────────────────────────────────────────────────────
CSV_FIELDS = [
    "osm_id","osm_type","city","category","name","name_en","name_ta",
    "lat","lon","amenity","tourism","shop","leisure","historic",
    "healthcare","railway","aeroway","religion","operator",
    "opening_hours","phone","website","addr_street","addr_city"
]
csv_path = os.path.join(OUT, "geoguide_pois.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
    w.writeheader()
    w.writerows(deduped)
print(f"Written: {csv_path}  ({len(deduped):,} rows)")

# ─── Task 6: Summary table ────────────────────────────────────────────────────
print("\n" + "=" * 70)
print(f"{'City':<18} {'Category':<35} {'Count':>6}")
print("-" * 70)

cat_totals = defaultdict(int)
city_totals = defaultdict(int)

summary_rows = []
for city in ["Chennai", "Kanchipuram", "Madurai"]:
    cat_counts = defaultdict(int)
    for p in by_city.get(city, []):
        cat_counts[p["category"]] += 1
        city_totals[city] += 1
        cat_totals[p["category"]] += 1
    for cat in sorted(cat_counts):
        print(f"{city:<18} {cat:<35} {cat_counts[cat]:>6}")
        summary_rows.append({"city": city, "category": cat, "count": cat_counts[cat]})

print("-" * 70)
print(f"\nTotal POIs extracted  : {len(deduped):,}")
for city in ["Chennai", "Kanchipuram", "Madurai"]:
    print(f"  {city:<16}: {city_totals.get(city,0):,}")
print("\nBy category:")
for cat in sorted(cat_totals):
    print(f"  {cat:<35}: {cat_totals[cat]:,}")
print(f"\nMissing names  : {missing_name:,}")
print(f"Invalid geom   : {invalid_geom}")
print(f"Duplicates rm  : {dup_count:,}")

# Save summary JSON for report
summary = {
    "total_pois": len(deduped),
    "city_totals": dict(city_totals),
    "category_totals": dict(cat_totals),
    "missing_name": missing_name,
    "invalid_geom": invalid_geom,
    "duplicates_removed": dup_count,
    "summary_rows": summary_rows,
}
sum_path = os.path.join(os.path.dirname(__file__), "extract_summary.json")
with open(sum_path, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)
print(f"\nSummary saved: {sum_path}")
print("\nTasks 2-6 complete.")
