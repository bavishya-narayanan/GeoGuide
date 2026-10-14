import PlaceCard from './PlaceCard';

export default function PlaceList({ places, onFavorite, onSelect }) {
  return <div className="place-list">{places.map((place) => <PlaceCard key={place.osm_id} place={place} onFavorite={onFavorite} onSelect={onSelect} />)}</div>;
}