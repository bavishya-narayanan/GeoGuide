"""
Phase 1 – Task 1: Inspect the Tamil Nadu PBF file
Reads the PBF using osmium and collects tag/category/type statistics.
"""

import osmium
import json
import os
from collections import Counter, defaultdict

PBF_PATH = os.path.join(os.path.dirname(__file__), "..", "tamil_nadu.pbf")

class InspectHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.node_count = 0
        self.way_count = 0
        self.relation_count = 0
        self.tag_keys = Counter()
        self.amenity_values = Counter()
        self.tourism_values = Counter()
        self.shop_values = Counter()
        self.leisure_values = Counter()
        self.highway_values = Counter()
        self.place_values = Counter()
        self.landuse_values = Counter()
        self.historic_values = Counter()
        self.healthcare_values = Counter()
        self.religion_values = Counter()
        self.name_langs = Counter()
        self.has_name = 0
        self.has_name_en = 0
        self.has_name_ta = 0
        self.sample_nodes = []   # up to 20 sample node records
        self.sample_ways = []
        self.lat_min = float('inf')
        self.lat_max = float('-inf')
        self.lon_min = float('inf')
        self.lon_max = float('-inf')

    def _collect_tags(self, tags):
        for t in tags:
            self.tag_keys[t.k] += 1
            if t.k == "amenity":   self.amenity_values[t.v] += 1
            if t.k == "tourism":   self.tourism_values[t.v] += 1
            if t.k == "shop":      self.shop_values[t.v] += 1
            if t.k == "leisure":   self.leisure_values[t.v] += 1
            if t.k == "highway":   self.highway_values[t.v] += 1
            if t.k == "place":     self.place_values[t.v] += 1
            if t.k == "landuse":   self.landuse_values[t.v] += 1
            if t.k == "historic":  self.historic_values[t.v] += 1
            if t.k == "healthcare":self.healthcare_values[t.v] += 1
            if t.k == "religion":  self.religion_values[t.v] += 1
            if t.k == "name":      self.has_name += 1
            if t.k == "name:en":   self.has_name_en += 1
            if t.k == "name:ta":   self.has_name_ta += 1
            if t.k.startswith("name:"):
                self.name_langs[t.k] += 1

    def node(self, n):
        self.node_count += 1
        self._collect_tags(n.tags)
        if n.location.valid():
            lat, lon = n.location.lat, n.location.lon
            if lat < self.lat_min: self.lat_min = lat
            if lat > self.lat_max: self.lat_max = lat
            if lon < self.lon_min: self.lon_min = lon
            if lon > self.lon_max: self.lon_max = lon
        if len(self.sample_nodes) < 20 and len(n.tags) > 3:
            self.sample_nodes.append({
                "id": n.id,
                "lat": n.location.lat if n.location.valid() else None,
                "lon": n.location.lon if n.location.valid() else None,
                "tags": {t.k: t.v for t in n.tags}
            })

    def way(self, w):
        self.way_count += 1
        self._collect_tags(w.tags)
        if len(self.sample_ways) < 10 and len(w.tags) > 3:
            self.sample_ways.append({
                "id": w.id,
                "node_count": len(w.nodes),
                "tags": {t.k: t.v for t in w.tags}
            })

    def relation(self, r):
        self.relation_count += 1
        self._collect_tags(r.tags)


print("=" * 60)
print("Phase 1 – PBF Inspection")
print("=" * 60)

pbf_size = os.path.getsize(PBF_PATH)
print(f"PBF file size : {pbf_size:,} bytes  ({pbf_size / 1024 / 1024:.1f} MB)")
print(f"PBF path      : {os.path.abspath(PBF_PATH)}")
print()
print("Scanning PBF (this may take a few minutes)...")

h = InspectHandler()
h.apply_file(PBF_PATH, locations=False)

print("\n--- Object Counts ---")
print(f"  Nodes     : {h.node_count:>10,}")
print(f"  Ways      : {h.way_count:>10,}")
print(f"  Relations : {h.relation_count:>10,}")

print("\n--- Geographic Extent (from node coordinates) ---")
print(f"  Lat range : {h.lat_min:.4f}  to  {h.lat_max:.4f}")
print(f"  Lon range : {h.lon_min:.4f}  to  {h.lon_max:.4f}")

print("\n--- Name Availability ---")
print(f"  Objects with name      : {h.has_name:,}")
print(f"  Objects with name:en   : {h.has_name_en:,}")
print(f"  Objects with name:ta   : {h.has_name_ta:,}")

print("\n--- Top 30 Tag Keys ---")
for k, v in h.tag_keys.most_common(30):
    print(f"  {k:<30s} : {v:>8,}")

print("\n--- Amenity values (top 40) ---")
for k, v in h.amenity_values.most_common(40):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Tourism values ---")
for k, v in h.tourism_values.most_common(20):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Shop values (top 20) ---")
for k, v in h.shop_values.most_common(20):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Leisure values ---")
for k, v in h.leisure_values.most_common(20):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Historic values ---")
for k, v in h.historic_values.most_common(20):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Healthcare values ---")
for k, v in h.healthcare_values.most_common(20):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Religion values ---")
for k, v in h.religion_values.most_common(10):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Place values ---")
for k, v in h.place_values.most_common(15):
    print(f"  {k:<35s} : {v:>6,}")

print("\n--- Name language keys (top 15) ---")
for k, v in h.name_langs.most_common(15):
    print(f"  {k:<30s} : {v:>6,}")

print("\n--- Sample Nodes (with tags) ---")
for s in h.sample_nodes[:5]:
    print(f"  id={s['id']}  lat={s['lat']}  lon={s['lon']}")
    for k2, v2 in list(s['tags'].items())[:8]:
        print(f"    {k2}: {v2}")
    print()

# Dump full stats to JSON for report generation
out = {
    "pbf_size_bytes": pbf_size,
    "node_count": h.node_count,
    "way_count": h.way_count,
    "relation_count": h.relation_count,
    "lat_min": h.lat_min,
    "lat_max": h.lat_max,
    "lon_min": h.lon_min,
    "lon_max": h.lon_max,
    "has_name": h.has_name,
    "has_name_en": h.has_name_en,
    "has_name_ta": h.has_name_ta,
    "tag_keys_top50": dict(h.tag_keys.most_common(50)),
    "amenity_values": dict(h.amenity_values),
    "tourism_values": dict(h.tourism_values),
    "shop_values": dict(h.shop_values),
    "leisure_values": dict(h.leisure_values),
    "historic_values": dict(h.historic_values),
    "healthcare_values": dict(h.healthcare_values),
    "religion_values": dict(h.religion_values),
    "place_values": dict(h.place_values),
    "name_langs": dict(h.name_langs),
    "sample_nodes": h.sample_nodes,
    "sample_ways": h.sample_ways,
}

stats_path = os.path.join(os.path.dirname(__file__), "inspect_stats.json")
with open(stats_path, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"\nFull stats saved to: {stats_path}")
print("\nDone.")
