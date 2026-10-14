import { LockKeyhole } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function Login() {
  const { login, error, loading, clearError } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const submit = async (event) => { event.preventDefault(); clearError(); try { await login(form); navigate(location.state?.from || '/profile', { replace: true }); } catch { /* Context exposes the request error. */ } };
  return <div className="auth-page"><div className="auth-card"><span className="kicker">Welcome back</span><h1>Log in to GeoGuide</h1><p>Keep your favorites, reviews, and search history connected to you.</p><form onSubmit={submit}><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required /></label>{error && <div className="alert error">{error}</div>}<button className="primary-button full" disabled={loading} type="submit"><LockKeyhole size={16} />{loading ? 'Logging in...' : 'Log in'}</button></form><p className="auth-switch">New to GeoGuide? <Link to="/register">Create an account</Link></p></div></div>;
}
