import { Link } from 'react-router-dom';
import { Clock, Handshake } from 'lucide-react';
import CategoryIcon from '../ui/CategoryIcon';
import { timeAgo } from '../../utils/helpers';

export default function RequestCard({ request, matchReasons }) {
  return (
    <Link to={`/requests/${request.id}`} className="card p-5 min-w-0 flex flex-col gap-3 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          {request.category_name && (
            <span className="w-7 h-7 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <CategoryIcon name={request.category_icon} size={14} />
            </span>
          )}
          <span>{request.category_name || 'Other'}</span>
        </div>
        <span className="text-xs text-ink-faint whitespace-nowrap">{timeAgo(request.created_at)}</span>
      </div>

      <p className="font-display font-bold text-ink leading-snug line-clamp-2">{request.title}</p>
      <p className="text-sm text-ink-muted line-clamp-2">{request.description}</p>

      {matchReasons?.length > 0 && (
        <div className="bg-accent-tint/60 rounded-card px-3 py-2">
          <p className="text-xs text-ink-muted">• {matchReasons[0]}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-line mt-auto text-sm">
        <span className="font-semibold text-ink">{request.budget_range}</span>
        <span className="flex items-center gap-3 text-ink-muted text-xs">
          <span className="flex items-center gap-1"><Clock size={12} /> {request.timeline}</span>
          {request.offer_count !== undefined && (
            <span className="flex items-center gap-1"><Handshake size={12} /> {request.offer_count}</span>
          )}
        </span>
      </div>
    </Link>
  );
}
