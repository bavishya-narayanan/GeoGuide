import { Compass, Heart, History, Menu, UserRound, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../context/UserContext';

const links = [['/', 'Home', Compass], ['/search', 'Search', Compass], ['/favorites', 'Favorites', Heart], ['/history', 'History', History], ['/my-reviews', 'Reviews', History], ['/profile', 'Profile', UserRound]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useUser();
  const signOut = async () => { await logout(); navigate('/'); };
  return <header className="navbar">
    <div className="nav-inner">
      <NavLink to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><Compass size={20} /></span><span>GeoGuide</span></NavLink>
      <button className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'nav-links nav-open' : 'nav-links'}>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Icon size={16} />{label}</NavLink>)}{isAuthenticated ? <button className="nav-link nav-action" type="button" onClick={signOut}>Log out</button> : <NavLink to="/login" onClick={() => setOpen(false)} className="nav-link">Log in</NavLink>}</nav>
    </div>
  </header>;
}