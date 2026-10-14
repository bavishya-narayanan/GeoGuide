import { useEffect, useState } from 'react';
import PlaceList from '../components/PlaceList';
import Loading from '../components/Loading';
import { api, getApiError } from '../services/api';
import { useUser } from '../context/UserContext';

export default function Favorites() {
  const { userId } = useUser(); const [places, setPlaces] = useState([]); const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => { if (!userId) return; api.getFavorites().then((data) => { setPlaces(data.results || []); setState({ loading: false, error: '' }); }).catch((error) => setState({ loading: false, error: getApiError(error) })); }, [userId]);
  const remove = async (place) => { try { await api.removeFavorite(place.osm_id, userId); setPlaces((items) => items.filter((item) => item.osm_id !== place.osm_id)); } catch (error) { setState((current) => ({ ...current, error: getApiError(error, 'Favorite could not be removed.') })); } };
  return <div><div className="page-heading"><span className="kicker">Saved for later</span><h1>Your favorites</h1><p>Places you chose to keep close.</p></div>{state.error && <div className="alert error">{state.error}</div>}{state.loading ? <Loading label="Loading favorites..." /> : places.length ? <PlaceList places={places} onFavorite={remove} /> : <div className="empty-state"><h2>You haven't saved any places yet.</h2><p>Tap the heart on a place to find it here.</p></div>}</div>;
}