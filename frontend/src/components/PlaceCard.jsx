import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import Rating from './Rating';

function distanceLabel(meters) { if (meters === undefined || meters === null) return null; return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`; }

export default function PlaceCard({ place, onFavorite, onSelect }) {
  const details = place.details || {};
  const address = details.address?.street || details.address?.city;
  const selectCard = (event) => { if (event.target.closest('a,button')) return; onSelect?.(place); };
  return <article className={`place-card${onSelect ? ' map-linked' : ''}`} onClick={selectCard} onKeyDown={(event) => { if (event.key === 'Enter') onSelect?.(place); }} tabIndex={onSelect ? 0 : undefined}>
    <div className="place-card-top"><div><span className="eyebrow">{place.category || 'Place'} · {place.city || 'Tamil Nadu'}</span><h3>{place.display_name || place.name || `${(place.category || 'Place').charAt(0).toUpperCase() + (place.category || 'Place').slice(1).replace(/_/g, ' ')}${place.city ? ' · ' + place.city : ''}`}</h3></div>{onFavorite && <FavoriteButton active={Boolean(place.user_interaction?.is_favorite)} onClick={() => onFavorite(place)} />}</div>
    <div className="place-meta">{address ? <span><MapPin size={15} />{address}</span> : <span><MapPin size={15} />Address not available</span>}{distanceLabel(place.distance_meters) && <span>{distanceLabel(place.distance_meters)}</span>}</div>
    <div className="place-card-bottom"><span><Rating value={place.rating_summary?.average} />{place.rating_summary?.count ? <small className="rating-count">{place.rating_summary.count} rating{place.rating_summary.count === 1 ? '' : 's'}</small> : <small className="rating-count">No ratings yet</small>}{place.user_interaction?.review && <small className="review-indicator">You reviewed this place</small>}</span><Link className="text-link" to={`/places/${place.osm_id}`}>View details <ArrowUpRight size={15} /></Link></div>
  </article>;
}