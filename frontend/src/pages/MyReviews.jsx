import { ArrowUpRight, CalendarClock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { api, getApiError } from '../services/api';
import { useUser } from '../context/UserContext';

export default function MyReviews() {
  const { userId } = useUser();
  const [items, setItems] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => { api.getUserReviews().then((data) => { setItems(data.results || []); setState({ loading: false, error: '' }); }).catch((error) => setState({ loading: false, error: getApiError(error) })); }, [userId]);
  return <div><div className="page-heading"><span className="kicker">Your voice</span><h1>My reviews</h1><p>Places and experiences you have shared.</p></div>{state.error && <div className="alert error">{state.error}</div>}{state.loading ? <Loading label="Loading reviews..." /> : items.length ? <div className="my-review-list">{items.map((item) => <article className="detail-panel my-review" key={item.osm_id}><div className="my-review-heading"><div><span className="eyebrow">{item.category} · {item.city}</span><h2>{item.display_name}</h2></div><Link className="text-link" to={`/places/${item.osm_id}`}>View place <ArrowUpRight size={15} /></Link></div><div className="my-review-meta"><span><Star size={15} fill="currentColor" />{item.user_review?.review_text ? 'Reviewed' : 'Review'}</span><span><CalendarClock size={15} />{item.user_review?.updated_at ? new Date(item.user_review.updated_at).toLocaleDateString() : ''}</span></div><p>{item.user_review?.review_text}</p></article>)}</div> : <div className="empty-state"><h2>You haven't reviewed any places yet.</h2><p>Your published reviews will appear here.</p></div>}</div>;
}
