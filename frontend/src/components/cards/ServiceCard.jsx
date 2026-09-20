import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import RatingStars from '../ui/RatingStars';
import { formatINR, coverGradient } from '../../utils/helpers';

export default function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.id}`} className="card overflow-hidden min-w-0 flex flex-col hover:shadow-lift hover:-translate-y-0.5 transition-all duration-150">
      <div className="h-28 w-full" style={{ background: coverGradient(service.cover_seed || service.id) }} />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-xs text-ink-muted truncate">{service.provider_name}</p>
        <p className="font-display font-bold text-ink leading-snug line-clamp-2">{service.title}</p>
        <div className="flex items-center gap-3 text-xs text-ink-muted mt-auto pt-2">
          <RatingStars rating={service.rating_avg} count={service.rating_count} size={12} />
          <span className="flex items-center gap-1"><Clock size={12} /> {service.delivery_days}d</span>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-2.5 mt-1">
          <span className="text-xs text-ink-faint">Starting at</span>
          <span className="font-semibold text-ink text-sm">{formatINR(service.starting_price)}</span>
        </div>
      </div>
    </Link>
  );
}
