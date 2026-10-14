export const CITIES = { Chennai: [13.0827, 80.2707], Kanchipuram: [12.8342, 79.7036], Madurai: [9.9252, 78.1198] };
export const CATEGORIES = ['Airport', 'ATM', 'Bank', 'Bar / Pub', 'Buddhist Temple', 'Cafe', 'Church', 'Cinema / Entertainment', 'Clinic / Healthcare', 'College / University', 'Community Centre', 'Fire Station', 'Fuel Station', 'Gurudwara', 'Historic Site', 'Hospital', 'Hotel', 'Jain Temple', 'Library', 'Market / Shopping', 'Mosque', 'Museum', 'Park', 'Parking', 'Pharmacy', 'Police', 'Post Office', 'Religious Place', 'Restaurant', 'School', 'Shop', 'Stadium / Sports', 'Street Food / Fast Food', 'Temple', 'Tourist Attraction', 'Transport', 'Veterinary'];
export const RADII = [1, 2, 3, 5, 10];

export default function SearchFilters({ filters, onChange, compact = false, hideCity = false, hideSort = false }) {
  return <div className={compact ? 'filter-grid compact' : 'filter-grid'}>
    {!hideCity && <label>City<select value={filters.city} onChange={(event) => onChange({ city: event.target.value })}><option value="">All cities</option>{Object.keys(CITIES).map((city) => <option key={city}>{city}</option>)}</select></label>}
    <label>Category<select value={filters.category} onChange={(event) => onChange({ category: event.target.value })}><option value="">All categories</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
    <label>Radius<select value={filters.radius} onChange={(event) => onChange({ radius: Number(event.target.value) })}>{RADII.map((radius) => <option key={radius} value={radius}>{radius} km</option>)}</select></label>
    {!hideSort && <label>Sort<select value={filters.sort || 'distance'} onChange={(event) => onChange({ sort: event.target.value })}><option value="distance">Nearest first</option><option value="distance_desc">Farthest first</option><option value="name">Name A-Z</option></select></label>}
  </div>;
}