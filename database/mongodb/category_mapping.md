# MongoDB Category Mapping

The OpenStreetMap dataset contains a vast array of unique tags for locations. During the extraction in Phase 1, we normalized these into broader, high-level categories that serve the "discovery" purpose of GeoGuide. 

The `places` MongoDB collection uses these standardized categories in the `category` string field.

## Mapping Rules Used

The `category` field was derived using the following priority order based on raw OSM tags:

1. **Hospital / Healthcare**:
   - `amenity='hospital'` ➔ **Hospital**
   - `amenity='clinic'`, `amenity='doctors'`, `amenity='dentist'`, `amenity='pharmacy'`, or `healthcare=*` ➔ **Clinic / Healthcare**

2. **Food / Dining**:
   - `amenity='restaurant'`, `amenity='food_court'` ➔ **Restaurant**
   - `amenity='cafe'` ➔ **Cafe**
   - `amenity='fast_food'` ➔ **Fast Food**

3. **Religion**:
   - `religion='hindu'` or `amenity='place_of_worship'` (if name indicates temple) ➔ **Temple**
   - `religion='muslim'` ➔ **Mosque**
   - `religion='christian'` ➔ **Church**
   - Other `amenity='place_of_worship'` ➔ **Place of Worship**

4. **Accommodation**:
   - `tourism='hotel'`, `tourism='hostel'`, `tourism='guest_house'` ➔ **Hotel**

5. **Shopping / Retail**:
   - `shop=*` (any non-empty shop value) ➔ **Shop**
   - `amenity='marketplace'` ➔ **Market**

6. **Transport**:
   - `aeroway=*`, `railway='station'`, `amenity='bus_station'` ➔ **Transport**

7. **Finance**:
   - `amenity='bank'` ➔ **Bank**
   - `amenity='atm'` ➔ **ATM**

8. **Education**:
   - `amenity='school'`, `amenity='college'`, `amenity='university'` ➔ **Education**

9. **Tourism & Leisure**:
   - `historic=*`, `tourism='museum'`, `tourism='attraction'` ➔ **Tourist Attraction**
   - `leisure='park'` ➔ **Park**

*Any POI that fell outside these core mapping priorities was categorized as **Other** or its raw amenity tag (Capitalized).*

## Important Sub-Attributes
While the main `category` provides high-level searchability, the `attributes` sub-document in MongoDB retains the original tags (e.g., `attributes.shop = 'supermarket'`) so that fine-grained searching is still possible without polluting the main category hierarchy.
