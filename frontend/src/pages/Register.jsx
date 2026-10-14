import { UserRoundPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function Register() {
  const { register, error, loading, clearError } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const submit = async (event) => { event.preventDefault(); clearError(); try { await register(form); navigate('/profile', { replace: true }); } catch { /* Context exposes the request error. */ } };
  return <div className="auth-page"><div className="auth-card"><span className="kicker">Make it yours</span><h1>Create your GeoGuide account</h1><p>Save places and keep your discoveries close.</p><form onSubmit={submit}><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength="8" required /><small>Use 8 to 128 characters.</small></label>{error && <div className="alert error">{error}</div>}<button className="primary-button full" disabled={loading} type="submit"><UserRoundPlus size={16} />{loading ? 'Creating account...' : 'Create account'}</button></form><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></div></div>;
}
