import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getApiError, setAuthToken, setUnauthorizedHandler } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ loading: Boolean(localStorage.getItem('geoguide_token')), error: '' });

  const logout = async () => {
    try { if (localStorage.getItem('geoguide_token')) await api.logout(); } finally { setAuthToken(null); setUser(null); }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => { setAuthToken(null); setUser(null); setState({ loading: false, error: 'Your session has expired. Please log in again.' }); });
    if (!localStorage.getItem('geoguide_token')) return;
    api.getCurrentUser().then((data) => { setUser(data.user); setState({ loading: false, error: '' }); }).catch((error) => { setAuthToken(null); setState({ loading: false, error: getApiError(error) }); });
    return () => setUnauthorizedHandler(null);
  }, []);

  const authenticate = async (method, payload) => {
    setState({ loading: true, error: '' });
    try { const data = await method(payload); setAuthToken(data.token); setUser(data.user); setState({ loading: false, error: '' }); return data; } catch (error) { const message = getApiError(error, 'Authentication failed.'); setState({ loading: false, error: message }); throw error; }
  };

  const login = (payload) => authenticate(api.login, payload);
  const register = (payload) => authenticate(api.register, payload);
  const value = useMemo(() => ({ user, userId: user?.id || '', isAuthenticated: Boolean(user), loading: state.loading, error: state.error, login, register, logout, clearError: () => setState((current) => ({ ...current, error: '' })) }), [user, state.loading, state.error]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}