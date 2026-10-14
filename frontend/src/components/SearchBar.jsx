import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, onSubmit }) {
  return <form className="search-bar" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><Search size={20} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Try “temples in Kanchipuram”" aria-label="Search places" /><button className="primary-button" type="submit">Search</button></form>;
}