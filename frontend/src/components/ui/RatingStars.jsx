import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, count, size = 14, showNumber = true, className = '' }) {
  if (!rating || rating === 0) {
    return <span className={`text-sm text-ink-faint ${className}`}>New</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm text-ink ${className}`}>
      <Star size={size} className="fill-warning text-warning" />
      <span className="font-medium">{Number(rating).toFixed(1)}</span>
      {count !== undefined && <span className="text-ink-faint">({count})</span>}
    </span>
  );
}
