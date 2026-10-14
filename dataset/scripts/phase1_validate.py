"""
Phase 1 - Task 7: Validate all outputs
Checks GeoJSON files, CSV, coordinate ranges, category values, and PBF integrity.
"""

import json
import csv
import os
import hashlib
import sys

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE   = os.path.join(os.path.dirname(__file__), "..")
OUT    = os.path.join(BASE, "processed")
PBF    = os.path.join(BASE, "tamil_nadu.pbf")
SCRIPTS = os.path.dirname(__file__)

# City coordinate bounds for validation
CITY_BOUNDS = {
    "Chennai":      {"lat": (12.75, 13.23), "lon": (79.90, 80.32)},
    "Kanchipuram":  {"lat": (12.78, 12.90), "lon": (79.62, 79.80)},
    "Madurai":      {"lat": ( 9.80, 10.05), "lon": (77.85, 78.20)},
}

EXPECTED_FILES = [
    "chennai_pois.geojson",
    "kanchipuram_pois.geojson",
    "madurai_pois.geojson",
    "geoguide_pois.csv",
]

print("=" * 60)
print("Phase 1 – Task 7: Validation")
print("=" * 60)

errors   = []
warnings = []
passed   = []

# ── 1. PBF still exists and unchanged size ────────────────────────────────
pbf_size = os.path.getsize(PBF)
if pbf_size == 129636304:
    passed.append(f"[OK] PBF intact: {pbf_size:,} bytes (129,636,304 expected)")
else:
    errors.append(f"[FAIL] PBF size mismatch: got {pbf_size}, expected 129,636,304")

# ── 2. All output files exist ─────────────────────────────────────────────
for fname in EXPECTED_FILES:
    fpath = os.path.join(OUT, fname)
    if os.path.exists(fpath):
        size = os.path.getsize(fpath)
        passed.append(f"[OK] {fname} exists ({size:,} bytes)")
    else:
        errors.append(f"[FAIL] MISSING: {fname}")

# ── 3. Validate GeoJSON files ─────────────────────────────────────────────
for city in ["Chennai", "Kanchipuram", "Madurai"]:
    fname = f"{city.lower()}_pois.geojson"
    fpath = os.path.join(OUT, fname)
    if not os.path.exists(fpath):
        continue
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            gj = json.load(f)
        assert gj["type"] == "FeatureCollection"
        features = gj["features"]
        n = len(features)
        if n == 0:
            warnings.append(f"[WARN] {fname}: 0 features (city may have no POIs in data)")
        else:
            passed.append(f"[OK] {fname}: {n:,} features, valid GeoJSON")

        bounds = CITY_BOUNDS[city]
        out_of_range = 0
        missing_coords = 0
        bad_category = 0
        for feat in features:
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates")
            if not coords or len(coords) < 2:
                missing_coords += 1
                continue
            lon, lat = coords[0], coords[1]
            if not (bounds["lat"][0] <= lat <= bounds["lat"][1] and
                    bounds["lon"][0] <= lon <= bounds["lon"][1]):
                out_of_range += 1
            props = feat.get("properties", {})
            if not props.get("category"):
                bad_category += 1

        if out_of_range > 0:
            warnings.append(f"[WARN] {fname}: {out_of_range} features outside expected bounds")
        else:
            passed.append(f"[OK] {fname}: all coordinates within {city} bounds")

        if missing_coords > 0:
            errors.append(f"[FAIL] {fname}: {missing_coords} features missing coordinates")
        else:
            passed.append(f"[OK] {fname}: all features have coordinates")

        if bad_category > 0:
            warnings.append(f"[WARN] {fname}: {bad_category} features missing category")
        else:
            passed.append(f"[OK] {fname}: all features have category values")

    except Exception as e:
        errors.append(f"❌ {fname}: could not parse – {e}")

# ── 4. Validate CSV ───────────────────────────────────────────────────────
csv_path = os.path.join(OUT, "geoguide_pois.csv")
if os.path.exists(csv_path):
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        passed.append(f"[OK] geoguide_pois.csv: {len(rows):,} rows, readable")
        cities_in_csv = set(r["city"] for r in rows)
        for city in ["Chennai", "Kanchipuram", "Madurai"]:
            if city in cities_in_csv:
                count = sum(1 for r in rows if r["city"] == city)
                passed.append(f"[OK] CSV: {city} present with {count:,} rows")
            else:
                warnings.append(f"[WARN] CSV: {city} has NO rows")
    except Exception as e:
        errors.append(f"❌ geoguide_pois.csv: could not parse – {e}")

# ── 5. Cross-check GeoJSON vs CSV counts ────────────────────────────────
geojson_total = 0
for city in ["Chennai", "Kanchipuram", "Madurai"]:
    fpath = os.path.join(OUT, f"{city.lower()}_pois.geojson")
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            gj = json.load(f)
        geojson_total += len(gj["features"])

if os.path.exists(csv_path):
    with open(csv_path, "r", encoding="utf-8") as f:
        csv_total = sum(1 for _ in csv.DictReader(f))
    if geojson_total == csv_total:
        passed.append(f"[OK] GeoJSON total ({geojson_total:,}) matches CSV total ({csv_total:,})")
    else:
        warnings.append(f"[WARN] GeoJSON total ({geojson_total:,}) != CSV total ({csv_total:,})")

# ── Report ────────────────────────────────────────────────────────────────
print("\n--- PASSED ---")
for msg in passed:
    print(f"  {msg}")

if warnings:
    print("\n--- WARNINGS ---")
    for msg in warnings:
        print(f"  {msg}")

if errors:
    print("\n--- ERRORS ---")
    for msg in errors:
        print(f"  {msg}")

print("\n" + "=" * 60)
if errors:
    print(f"Validation FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
else:
    print(f"Validation PASSED [OK]  ({len(warnings)} warning(s))")

# Save validation results
val_out = {
    "passed": passed,
    "warnings": warnings,
    "errors": errors,
    "overall": "PASS" if not errors else "FAIL"
}
val_path = os.path.join(SCRIPTS, "validation_results.json")
with open(val_path, "w", encoding="utf-8") as f:
    json.dump(val_out, f, indent=2, ensure_ascii=False)
print(f"Results saved: {val_path}")
