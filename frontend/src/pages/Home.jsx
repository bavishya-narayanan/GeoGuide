import { ArrowRight, Building2, Coffee, Landmark, MapPin, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import SearchFilters, { CITIES } from '../components/SearchFilters';
import { api } from '../services/api';
import { useUser } from '../context/UserContext';

const categories = [['Temple', Landmark], ['Restaurant', Coffee], ['Hospital', Building2], ['Tourist Attraction', MapPin]];

export default function Home() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ city: 'Chennai', category: '', radius: 5 });
  const [preferredCategories, setPreferredCategories] = useState([]);
  useEffect(() => { if (userId) api.getProfile(userId).then((data) => setPreferredCategories(data.result?.preferred_categories || [])).catch(() => {}); }, [userId]);
  const update = (next) => setFilters((current) => ({ ...current, ...next }));
  const search = (category = filters.category, selectedCity = filters.city) => { const city = selectedCity || 'Chennai'; navigate(`/search?${new URLSearchParams({ q: query, city, category, radius: filters.radius })}`); };
  return <div>
    <section className="hero"><div className="hero-copy"><span className="kicker">Tamil Nadu, thoughtfully mapped</span><h1>Find the places that make a city feel like yours.</h1><p>Search local landmarks, everyday essentials, and memorable stops across Chennai, Kanchipuram, and Madurai.</p></div><div className="hero-search"><SearchBar value={query} onChange={setQuery} onSubmit={() => search()} /><SearchFilters filters={filters} onChange={update} /><button className="search-submit" onClick={() => search()}>Explore places <ArrowRight size={17} /></button></div></section>
    <section className="section-block"><div className="section-heading"><div><span className="kicker">Start with a feeling</span><h2>Browse by category</h2></div><button className="quiet-button" onClick={() => navigate('/search')}>View all <ArrowRight size={15} /></button></div><div className="category-grid">{categories.map(([name, Icon]) => <button key={name} className="category-tile" onClick={() => search(name)}><span className="category-icon"><Icon size={21} /></span><span>{name}</span><ArrowRight size={16} /></button>)}</div></section>
    {preferredCategories.length > 0 && <section className="preference-strip"><div><span className="kicker">Based on your preferences</span><h2>Explore nearby</h2></div><div className="preference-links">{preferredCategories.map((category) => <button key={category} onClick={() => search(category)}>{category}<ArrowRight size={15} /></button>)}</div></section>}
    <section className="city-strip"><div><span className="kicker">Three distinct rhythms</span><h2>Choose your next direction.</h2></div><div className="city-links">{Object.keys(CITIES).map((city) => <button key={city} onClick={() => search(filters.category, city)}><span>{city}</span><ArrowRight size={16} /></button>)}</div></section>
    <section className="trust-note"><SearchIcon size={18} /><span>Every result comes from GeoGuide’s live backend and spatial search. No invented places, ratings, or reviews.</span></section>
  </div>;
}