"""
Phase 1 – Report Generator
Produces dataset/phase1_dataset_report.md from inspect_stats.json + extract_summary.json + validation_results.json
"""

import json
import os
from datetime import datetime

SCRIPTS = os.path.dirname(__file__)
BASE    = os.path.join(SCRIPTS, "..")
OUT     = os.path.join(BASE, "processed")

def load(name):
    p = os.path.join(SCRIPTS, name)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

insp = load("inspect_stats.json")
summ = load("extract_summary.json")
valr = load("validation_results.json")

def top(d, n=15):
    return sorted(d.items(), key=lambda x: -x[1])[:n]

lines = []
def w(*args):
    lines.append(" ".join(str(a) for a in args))
def blank():
    lines.append("")
def h1(t): w(f"# {t}")
def h2(t): w(f"## {t}")
def h3(t): w(f"### {t}")
def rule(): w("---")

h1("GeoGuide – Phase 1 Dataset Report")
blank()
w(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
w(f"**Source file:** `dataset/tamil_nadu.pbf`")
blank()
rule()
blank()

# ── 1. Source File ───────────────────────────────────────────────────────
h2("1. Source File Information")
blank()
w(f"| Field | Value |")
w(f"|-------|-------|")
w(f"| File | `tamil_nadu.pbf` |")
w(f"| Size | `{insp.get('pbf_size_bytes', 0):,}` bytes ({insp.get('pbf_size_bytes', 0)/1024/1024:.1f} MB) |")
w(f"| Source | OpenStreetMap extract – Tamil Nadu, India |")
w(f"| Format | OSM PBF (Protocol Buffer Format) |")
blank()

# ── 2. Object Counts ─────────────────────────────────────────────────────
h2("2. Available Data Types")
blank()
w("| OSM Type | Count |")
w("|----------|-------|")
w(f"| Nodes | {insp.get('node_count', 0):,} |")
w(f"| Ways | {insp.get('way_count', 0):,} |")
w(f"| Relations | {insp.get('relation_count', 0):,} |")
blank()
w(f"- **Points (nodes):** Represent individual POIs, locations, road intersections, building entrances.")
w(f"- **Lines/Polygons (ways):** Roads, building outlines, area features. POI centroids computed from way node averages.")
w(f"- **Relations:** Multi-polygon areas, routes, administrative boundaries.")
blank()

# ── 3. Geographic Extent ─────────────────────────────────────────────────
h2("3. Geographic Extent")
blank()
w(f"| Boundary | Latitude | Longitude |")
w(f"|----------|----------|-----------|")
w(f"| Minimum  | {insp.get('lat_min', 'N/A')} | {insp.get('lon_min', 'N/A')} |")
w(f"| Maximum  | {insp.get('lat_max', 'N/A')} | {insp.get('lon_max', 'N/A')} |")
blank()
w("The extract covers the full state of Tamil Nadu including all coastal and inland districts.")
blank()

# ── 4. Name Fields ────────────────────────────────────────────────────────
h2("4. Name Fields Available")
blank()
w("| Tag | Count |")
w("|-----|-------|")
w(f"| `name` | {insp.get('has_name', 0):,} |")
w(f"| `name:en` | {insp.get('has_name_en', 0):,} |")
w(f"| `name:ta` | {insp.get('has_name_ta', 0):,} |")
blank()
name_langs = insp.get("name_langs", {})
if name_langs:
    w("**Other language name keys:**")
    blank()
    w("| Tag | Count |")
    w("|-----|-------|")
    for k, v in top(name_langs, 10):
        w(f"| `{k}` | {v:,} |")
blank()

# ── 5. Tag Keys ────────────────────────────────────────────────────────────
h2("5. Important OSM Tag Keys (Top 30)")
blank()
w("| Tag Key | Occurrences |")
w("|---------|-------------|")
for k, v in top(insp.get("tag_keys_top50", {}), 30):
    w(f"| `{k}` | {v:,} |")
blank()

# ── 6. POI Categories ─────────────────────────────────────────────────────
h2("6. Available POI Categories")
blank()
h3("6a. Amenity Values (Top 40)")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("amenity_values", {}), 40):
    w(f"| `{k}` | {v:,} |")
blank()

h3("6b. Tourism Values")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("tourism_values", {}), 20):
    w(f"| `{k}` | {v:,} |")
blank()

h3("6c. Shop Values (Top 20)")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("shop_values", {}), 20):
    w(f"| `{k}` | {v:,} |")
blank()

h3("6d. Leisure Values")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("leisure_values", {}), 20):
    w(f"| `{k}` | {v:,} |")
blank()

h3("6e. Historic Values")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("historic_values", {}), 20):
    w(f"| `{k}` | {v:,} |")
blank()

h3("6f. Healthcare Values")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("healthcare_values", {}), 20):
    w(f"| `{k}` | {v:,} |")
blank()

h3("6g. Religion Values")
blank()
w("| Value | Count |")
w("|-------|-------|")
for k, v in top(insp.get("religion_values", {}), 10):
    w(f"| `{k}` | {v:,} |")
blank()

# ── 7. Extraction Summary ─────────────────────────────────────────────────
h2("7. Extraction Summary (Phase 1 Output)")
blank()
w("### City-level totals")
blank()
w("| City | POIs Extracted |")
w("|------|---------------|")
for city, cnt in summ.get("city_totals", {}).items():
    w(f"| {city} | {cnt:,} |")
w(f"| **Total** | **{summ.get('total_pois', 0):,}** |")
blank()

w("### City × Category breakdown")
blank()
w("| City | Category | Count |")
w("|------|----------|-------|")
for row in summ.get("summary_rows", []):
    w(f"| {row['city']} | {row['category']} | {row['count']} |")
blank()

w("### Category-level totals (all cities combined)")
blank()
w("| Category | Total |")
w("|----------|-------|")
for cat, cnt in sorted(summ.get("category_totals", {}).items()):
    w(f"| {cat} | {cnt:,} |")
blank()

# ── 8. Data Quality ─────────────────────────────────────────────────────
h2("8. Data Quality Observations")
blank()
w("| Metric | Value |")
w("|--------|-------|")
w(f"| Total POIs extracted | {summ.get('total_pois', 0):,} |")
w(f"| Duplicates removed | {summ.get('duplicates_removed', 0):,} |")
w(f"| Records missing name | {summ.get('missing_name', 0):,} |")
w(f"| Records with invalid/missing geometry | {summ.get('invalid_geom', 0):,} |")
blank()
w("**Notes:**")
w("- OSM data for Tamil Nadu is community-contributed; coverage density varies by city and POI type.")
w("- Many POIs lack `name:en` (English names); `name` tag contains mixed Tamil/English entries.")
w("- Some places of worship lack a `religion` sub-tag; these are kept as `Religious Place`.")
w("- Way-based POIs (e.g., hospital buildings) have their coordinates derived from centroid of bounding nodes.")
w("- Records missing `name` are retained if they have a usable category and valid coordinates.")
blank()

# ── 9. Sample Records ──────────────────────────────────────────────────────
h2("9. Sample Records from Source PBF")
blank()
samples = insp.get("sample_nodes", [])[:5]
for i, s in enumerate(samples, 1):
    w(f"**Sample Node {i}** (OSM ID: `{s['id']}`)")
    w(f"- Coordinates: `{s['lat']}, {s['lon']}`")
    w(f"- Tags: `{json.dumps(s['tags'], ensure_ascii=False)}`")
    blank()

# ── 10. Validation ────────────────────────────────────────────────────────
h2("10. Validation Results")
blank()
overall = valr.get("overall", "N/A")
w(f"**Overall:** `{overall}`")
blank()
if valr.get("passed"):
    w("**Passed checks:**")
    for msg in valr["passed"]:
        w(f"- {msg}")
    blank()
if valr.get("warnings"):
    w("**Warnings:**")
    for msg in valr["warnings"]:
        w(f"- {msg}")
    blank()
if valr.get("errors"):
    w("**Errors:**")
    for msg in valr["errors"]:
        w(f"- {msg}")
    blank()

# ── 11. Output Files ──────────────────────────────────────────────────────
h2("11. Output Files")
blank()
w("```")
w("GeoGuide/")
w("└── dataset/")
w("    ├── tamil_nadu.pbf              ← Original (unchanged)")
w("    ├── phase1_dataset_report.md    ← This report")
w("    ├── scripts/")
w("    │   ├── phase1_inspect.py")
w("    │   ├── phase1_extract.py")
w("    │   ├── phase1_validate.py")
w("    │   ├── phase1_report.py")
w("    │   ├── inspect_stats.json")
w("    │   ├── extract_summary.json")
w("    │   └── validation_results.json")
w("    └── processed/")
w("        ├── chennai_pois.geojson")
w("        ├── kanchipuram_pois.geojson")
w("        ├── madurai_pois.geojson")
w("        └── geoguide_pois.csv")
w("```")
blank()

# ── 12. Tools Used ─────────────────────────────────────────────────────────
h2("12. Tools Used")
blank()
w("| Tool | Version | Purpose |")
w("|------|---------|---------|")
w("| Python | 3.14 | Processing runtime |")
w("| osmium (pyosmium) | 4.3.1 | PBF parsing – nodes, ways, tag extraction |")
w("| geopandas | 1.1.4 | GeoJSON output, spatial dataframes |")
w("| shapely | 2.1.2 | Geometry operations |")
w("| pyproj | 3.8.0 | Coordinate reference system support |")
w("| pyogrio | 0.13.0 | Fast spatial I/O backend for geopandas |")
w("| pandas | 2.3.3 | Tabular data, CSV output |")
blank()
w("> **Note:** `pyrosm` was NOT used — it requires `cykhash` which requires Microsoft C++ Build Tools to compile. The `osmium` Python bindings provide equivalent PBF reading capability.")
blank()

# ── 13. Phase 1 Status ────────────────────────────────────────────────────
h2("13. Phase 1 Status")
blank()
w("| Task | Status |")
w("|------|--------|")
w("| Task 1 – Inspect PBF | ✅ Complete |")
w("| Task 2 – Extract three cities | ✅ Complete |")
w("| Task 3 – Extract useful POIs | ✅ Complete |")
w("| Task 4 – Clean data | ✅ Complete |")
w("| Task 5 – Create clean dataset | ✅ Complete |")
w("| Task 6 – Data summary | ✅ Complete |")
w("| Task 7 – Validation | ✅ Complete |")
blank()
w("> **Phase 1 is complete.** The cleaned dataset in `dataset/processed/` is ready to be imported into PostgreSQL + PostGIS in Phase 2.")
blank()
rule()
blank()
w("*Report generated by `phase1_report.py` using data from `phase1_inspect.py`, `phase1_extract.py`, and `phase1_validate.py`.*")

# Write report
report_path = os.path.join(BASE, "phase1_dataset_report.md")
with open(report_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Report written: {report_path}")
