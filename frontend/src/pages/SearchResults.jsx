import { LocateFixed, MapPin, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceList from '../components/PlaceList';
import GeoMap from '../components/GeoMap';
import SearchBar from '../components/SearchBar';
import SearchFilters, { CITIES } from '../components/SearchFilters';
import Loading from '../components/Loading';
import { api, getApiError } from '../services/api';
import { getCurrentLocation } from '../services/location';
import { useUser } from '../context/UserContext';

function parsePhrase(query, current) {
  const lower = query.toLowerCase();
  const city = Object.keys(CITIES).find((name) => lower.includes(name.toLowerCase())) || current.city;
  const category = ['Temple', 'Restaurant', 'Hospital', 'Hotel', 'Shopping', 'Market / Shopping', 'Cafe', 'Park', 'Transport'].find((name) => lower.includes(name.toLowerCase()));
  return { city, category: category === 'Shopping' ? 'Market / Shopping' : category || current.category };
}

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const { userId } = useUser();
  const [query, setQuery] = useState(params.get('q') || '');
  const [filters, setFilters] = useState({ city: params.get('city') || 'Chennai', category: params.get('category') || '', radius: Number(params.get('radius')) || 5, sort: params.get('sort') || 'distance' });
  const [location, setLocation] = useState(() => {
    const city = params.get('city') || 'Chennai';
    const [latitude, longitude] = CITIES[city] || CITIES.Chennai;
    return { latitude, longitude, source: 'city', label: city };
  });
  const [locationStatus, setLocationStatus] = useState({ state: 'idle', message: '' });
  const [places, setPlaces] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [focusPlaceId, setFocusPlaceId] = useState(null);
  const [state, setState] = useState({ loading: true, error: '' });

  const search = async (nextFilters = filters, nextQuery = query, nextLocation = location) => {
    const parsed = parsePhrase(nextQuery, nextFilters);
    const selected = { ...nextFilters, ...parsed };
    const selectedLocation = nextLocation.source === 'city' && selected.city
      ? { latitude: CITIES[selected.city][0], longitude: CITIES[selected.city][1], source: 'city', label: selected.city }
      : nextLocation;
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      setState({ loading: false, error: 'Choose a search location before searching.' });
      return;
    }
    setFilters(selected);
    setLocation(selectedLocation);
    setParams({ q: nextQuery, city: selected.city, category: selected.category, radius: String(selected.radius), sort: selected.sort });
    setState({ loading: true, error: '' });
    try { const data = await api.searchPlaces({ ...selected, query: nextQuery, latitude: selectedLocation.latitude, longitude: selectedLocation.longitude, city: selectedLocation.source === 'city' ? selected.city : undefined }); setPlaces(data.results || []); setState({ loading: false, error: '' }); } catch (error) { setPlaces([]); setState({ loading: false, error: getApiError(error) }); }
  };

  useEffect(() => { search(); }, []);

  const useCurrentLocation = () => {
    setLocationStatus({ state: 'requesting', message: 'Getting your location...' });
    getCurrentLocation().then(({ latitude, longitude }) => {
      const currentLocation = { latitude, longitude, source: 'current', label: 'My Location' };
      const nextFilters = { ...filters, city: '' };
      setFilters(nextFilters);
      setLocation(currentLocation);
      setLocationStatus({ state: 'success', message: 'Location detected' });
      search(nextFilters, query, currentLocation);
    }).catch((error) => setLocationStatus({ state: 'error', message: error.code === error.PERMISSION_DENIED ? 'Location permission was not granted.' : 'Unable to determine your current location.' }));
  };

  const selectCity = (city) => {
    if (!city || !CITIES[city]) return;
    const next = { ...filters, city };
    const [latitude, longitude] = CITIES[city];
    setLocation({ latitude, longitude, source: 'city', label: city });
    setLocationStatus({ state: 'idle', message: '' });
    setFilters(next);
    search(next, query, { latitude, longitude, source: 'city', label: city });
  };

  const selectMapLocation = (nextLocation) => {
    setFilters((current) => ({ ...current, city: '' }));
    setLocation(nextLocation);
    setSelectedLocation(nextLocation);
    setLocationStatus({ state: 'idle', message: '' });
  };

  const searchHere = () => {
    if (!selectedLocation) return;
    search({ ...filters, city: '' }, query, selectedLocation);
    setSelectedLocation(null);
  };

  const updateFilters = (next) => {
    const updated = { ...filters, ...next };
    setFilters(updated);
    search(updated);
  };

  const focusPlace = (place) => setFocusPlaceId(place.osm_id);

  const updateFavorite = async (place) => {
    try { if (place.user_interaction?.is_favorite) await api.removeFavorite(place.osm_id, userId); else await api.addFavorite(place.osm_id, userId); setPlaces((items) => items.map((item) => item.osm_id === place.osm_id ? { ...item, user_interaction: { ...item.user_interaction, is_favorite: !place.user_interaction?.is_favorite } } : item)); } catch (error) { setState((current) => ({ ...current, error: getApiError(error, 'Favorite could not be updated.') })); }
  };
  const locationLabel = location.source === 'current' ? 'Using your current location' : location.source === 'city' ? `Searching around ${location.label}` : 'Selected location';
  return <div><div className="results-head"><div><span className="kicker">Explore the mapless view</span><h1>Search places</h1></div><span className="results-count">{!state.loading && `${places.length} place${places.length === 1 ? '' : 's'} found`}</span></div><div className="location-panel"><div className="location-panel-heading"><MapPin size={18} /><div><strong>Location</strong><span>{locationLabel}</span></div></div><div className="location-actions"><button className="outline-button" type="button" onClick={useCurrentLocation} disabled={locationStatus.state === 'requesting'}><LocateFixed size={16} />{locationStatus.state === 'requesting' ? 'Getting your location...' : 'Use My Location'}</button><label className="location-city">Select City<select value={filters.city} onChange={(event) => selectCity(event.target.value)}><option value="">Choose a city</option>{Object.keys(CITIES).map((city) => <option key={city}>{city}</option>)}</select></label><span className="map-prep-hint">Click the map to choose a location</span></div>{locationStatus.message && <p className={`location-message ${locationStatus.state}`}>{locationStatus.message}{locationStatus.state === 'error' && <button type="button" onClick={() => document.querySelector('.location-city select')?.focus()}>Choose a city instead</button>}</p>}</div><div className="results-toolbar"><SearchBar value={query} onChange={setQuery} onSubmit={() => search()} /><div className="filter-toggle"><SlidersHorizontal size={16} /> Filters</div><SearchFilters filters={filters} onChange={(next) => { if (next.city) selectCity(next.city); else updateFilters(next); }} compact hideCity /></div>{state.error && <div className="alert error">{state.error}</div>}<GeoMap center={location} userLocation={location.source === 'current' ? location : null} places={places} radius={filters.radius} selectedLocation={selectedLocation} focusPlaceId={focusPlaceId} onMapLocationSelect={selectMapLocation} onPlaceSelect={focusPlace} onLocateMe={useCurrentLocation} onSearchHere={searchHere} />{state.loading ? <Loading label="Searching places..." /> : places.length ? <PlaceList places={places} onSelect={focusPlace} onFavorite={userId ? updateFavorite : undefined} /> : <div className="empty-state"><h2>No places found in this area.</h2><p>Try a wider radius or choose another category.</p></div>}</div>;
}