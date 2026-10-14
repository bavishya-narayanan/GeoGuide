import { Heart } from 'lucide-react';

export default function FavoriteButton({ active, onClick, disabled = false }) {
  return <button className={active ? 'favorite-button saved' : 'favorite-button'} disabled={disabled} onClick={onClick} aria-label={active ? 'Remove from favorites' : 'Add to favorites'} title={active ? 'Remove from favorites' : 'Add to favorites'}><Heart size={18} fill={active ? 'currentColor' : 'none'} /></button>;
}