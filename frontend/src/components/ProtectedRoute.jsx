import { Navigate, useLocation } from 'react-router-dom';
import Loading from './Loading';
import { useUser } from '../context/UserContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUser();
  const location = useLocation();
  if (loading) return <Loading label="Checking your session..." />;
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
