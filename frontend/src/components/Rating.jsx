import { Star } from 'lucide-react';

export default function Rating({ value, editable = false, onChange }) {
  const safeValue = Number(value) || 0;
  return <div className={editable ? 'rating rating-editable' : 'rating'} aria-label={safeValue ? `${safeValue} out of 5 stars` : 'No rating'}>{[1, 2, 3, 4, 5].map((star) => editable ? <button type="button" key={star} className={star <= safeValue ? 'star selected' : 'star'} onClick={() => onChange(star)} aria-label={`Rate ${star} out of 5`}><Star size={20} fill="currentColor" /></button> : <Star key={star} size={16} fill={star <= safeValue ? 'currentColor' : 'none'} />)}{!editable && <span>{safeValue ? safeValue.toFixed(1) : 'Not rated'}</span>}</div>;
}