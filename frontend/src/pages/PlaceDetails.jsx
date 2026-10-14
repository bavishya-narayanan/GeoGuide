import { Clock3, Globe, MapPin, Navigation, Phone, Send, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FavoriteButton from '../components/FavoriteButton';
import Loading from '../components/Loading';
import Rating from '../components/Rating';
import { api, getApiError } from '../services/api';
import { useUser } from '../context/UserContext';
import { getCurrentLocation } from '../services/location';
import { buildGoogleMapsDirectionsUrl, validCoordinates } from '../services/directions';

function reviewStars(rating) {
  return rating ? `${'★'.repeat(Number(rating))}${'☆'.repeat(5 - Number(rating))}` : 'No rating';
}

export default function PlaceDetails() {
  const { osmId } = useParams();
  const { userId, isAuthenticated } = useUser();
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [directionsState, setDirectionsState] = useState({ status: 'idle', message: '', fallbackUrl: null });
  const [state, setState] = useState({ loading: true, error: '', message: '' });

  const load = async () => {
    try {
      const [placeData, reviewData] = await Promise.all([api.getPlace(osmId), api.getReviews(osmId)]);
      setPlace(placeData.result);
      setReviews(reviewData.results || []);
      setState({ loading: false, error: '', message: '' });
    } catch (error) {
      setState({ loading: false, error: getApiError(error, 'Place details could not be loaded.'), message: '' });
    }
  };

  useEffect(() => { load(); }, [osmId, userId]);

  if (state.loading) return <Loading label="Loading place details..." />;
  if (state.error || !place) return <div className="empty-state"><h2>{state.error || 'Place not found.'}</h2></div>;

  const details = place.details || {};
  const interaction = place.user_interaction || {};
  const summary = place.rating_summary || { average: 0, count: 0 };
  const ownReview = reviews.find((review) => String(review.user_id) === String(userId));
  const latitude = Number(place.location.latitude);
  const longitude = Number(place.location.longitude);

  const saveRating = async () => {
    if (!isAuthenticated) return setState((current) => ({ ...current, message: 'Log in to rate this place.' }));
    if (!rating) return setState((current) => ({ ...current, message: 'Choose a rating from 1 to 5 stars.' }));
    try {
      if (interaction.rating) await api.updateRating(osmId, rating);
      else await api.addRating(osmId, userId, rating);
      await load();
      setState((current) => ({ ...current, message: 'Rating saved.' }));
    } catch (error) { setState((current) => ({ ...current, message: getApiError(error, 'Rating could not be saved.') })); }
  };

  const saveReview = async () => {
    if (!isAuthenticated) return setState((current) => ({ ...current, message: 'Log in to write a review.' }));
    if (!reviewText.trim()) return setState((current) => ({ ...current, message: 'Write a review before submitting.' }));
    try {
      if (editingReviewId) await api.updateReview(editingReviewId, reviewText);
      else await api.addReview(osmId, userId, reviewText);
      setReviewText('');
      setEditingReviewId(null);
      await load();
      setState((current) => ({ ...current, message: 'Review saved.' }));
    } catch (error) { setState((current) => ({ ...current, message: getApiError(error, 'Review could not be saved.') })); }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.deleteReview(reviewId);
      await load();
      setState((current) => ({ ...current, message: 'Review deleted.' }));
    } catch (error) { setState((current) => ({ ...current, message: getApiError(error, 'Review could not be deleted.') })); }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) return setState((current) => ({ ...current, message: 'Log in to save favorites.' }));
    try {
      if (interaction.is_favorite) await api.removeFavorite(osmId, userId);
      else await api.addFavorite(osmId, userId);
      setPlace({ ...place, user_interaction: { ...interaction, is_favorite: !interaction.is_favorite } });
    } catch (error) { setState((current) => ({ ...current, message: getApiError(error, 'Favorite could not be updated.') })); }
  };

  const openDirections = () => {
    if (!validCoordinates(latitude, longitude)) {
      setDirectionsState({ status: 'unavailable', message: 'Directions unavailable for this place.', fallbackUrl: null });
      return;
    }
    const popup = window.open('', '_blank');
    if (!popup) {
      setDirectionsState({ status: 'error', message: 'Allow pop-ups to open Google Maps.', fallbackUrl: buildGoogleMapsDirectionsUrl({ latitude, longitude }) });
      return;
    }
    popup.opener = null;
    setDirectionsState({ status: 'requesting', message: 'Getting your location...', fallbackUrl: null });
    getCurrentLocation().then((origin) => {
      popup.location.href = buildGoogleMapsDirectionsUrl({ latitude, longitude }, origin);
      setDirectionsState({ status: 'success', message: 'Opening directions in Google Maps.', fallbackUrl: null });
    }).catch(() => {
      const fallbackUrl = buildGoogleMapsDirectionsUrl({ latitude, longitude });
      popup.location.href = fallbackUrl;
      setDirectionsState({ status: 'fallback', message: 'Current location unavailable. Opening the destination in Google Maps.', fallbackUrl });
    });
  };

  return <div className="details-page">
    <div className="detail-hero"><div><span className="eyebrow">{place.category} · {place.city}</span><h1>{place.display_name || place.name || `${(place.category || 'Place').charAt(0).toUpperCase() + (place.category || 'Place').slice(1).replace(/_/g, ' ')}${place.city ? ' · ' + place.city : ''}`}</h1><div className="detail-location"><MapPin size={17} />{details.address?.street || details.address?.city || 'Address not available'}</div></div><FavoriteButton active={Boolean(interaction.is_favorite)} onClick={toggleFavorite} /></div>
    <div className="detail-grid"><section className="detail-main">
      <div className="detail-panel"><h2>About this place</h2><p>{details.description || 'No description is available for this place yet.'}</p><div className="facts">{details.opening_hours ? <span><Clock3 size={16} />{details.opening_hours}</span> : <span><Clock3 size={16} />Opening hours not available</span>}{details.contact?.phone && <span><Phone size={16} />{details.contact.phone}</span>}{details.contact?.website && <a href={details.contact.website} target="_blank" rel="noreferrer"><Globe size={16} />Website</a>}<span><MapPin size={16} />{latitude.toFixed(5)}, {longitude.toFixed(5)}</span></div></div>
      {details.facilities?.length > 0 && <div className="detail-panel"><h2>Facilities</h2><div className="tag-list">{details.facilities.map((item) => <span key={item}>{item}</span>)}</div></div>}
      <div className="detail-panel"><h2>Ratings</h2><div className="rating-summary"><strong>{summary.count ? summary.average.toFixed(1) : 'No ratings yet'}</strong>{summary.count > 0 && <span>{summary.count} rating{summary.count === 1 ? '' : 's'}</span>}</div></div>
      <div className="detail-panel directions-panel"><h2>Navigate here</h2>{validCoordinates(latitude, longitude) ? <><button className="primary-button" type="button" onClick={openDirections} disabled={directionsState.status === 'requesting'}><Navigation size={16} />{directionsState.status === 'requesting' ? 'Getting your location...' : 'Get Directions'}</button>{directionsState.message && <p className="form-message">{directionsState.message}</p>}{directionsState.fallbackUrl && <a className="text-link" href={directionsState.fallbackUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>}</> : <p className="muted">Directions unavailable for this place.</p>}</div>
      <div className="detail-panel"><h2>Visitor reviews</h2>{reviews.length ? reviews.map((review) => <div className="review" key={review.id}><div><strong>{review.user_name || 'GeoGuide user'}</strong><span>{reviewStars(review.rating)}</span><time>{new Date(review.created_at).toLocaleDateString()}</time></div><p>{review.review_text}</p>{String(review.user_id) === String(userId) && <div className="review-actions"><button className="quiet-button" type="button" onClick={() => { setEditingReviewId(review.id); setReviewText(review.review_text); }}>Edit</button><button className="quiet-button danger-button" type="button" onClick={() => deleteReview(review.id)}><Trash2 size={14} />Delete</button></div>}</div>) : <p className="muted">No reviews yet.</p>}</div>
    </section><aside className="detail-side"><div className="interaction-panel"><span className="kicker">Your visit</span><h2>{editingReviewId ? 'Edit your review' : 'Leave a mark'}</h2><Rating value={rating || interaction.rating} editable onChange={setRating} /><button className="primary-button full" onClick={saveRating}><Star size={16} />Save rating</button><textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder={isAuthenticated ? 'Share your experience...' : 'Log in to write a review.'} disabled={!isAuthenticated} /><button className="outline-button full" onClick={saveReview}><Send size={16} />{editingReviewId ? 'Update review' : 'Publish review'}</button>{state.message && <p className="form-message">{state.message}</p>}</div></aside></div>
  </div>;
}
