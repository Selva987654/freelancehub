import { Link } from 'react-router-dom';
import { MapPin, Zap } from 'lucide-react';
import Avatar from '../ui/Avatar';
import RatingStars from '../ui/RatingStars';
import { formatINR } from '../../utils/helpers';

export default function ProviderCard({ provider }) {
  return (
    <Link to={`/providers/${provider.id}`} className="card p-5 min-w-0 flex flex-col gap-3 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-150">
      <div className="flex items-start gap-3">
        <Avatar seed={provider.avatar_url || provider.name} name={provider.name} size="lg" />
        <div className="min-w-0">
          <p className="font-display font-bold text-ink truncate">{provider.name}</p>
          <p className="text-sm text-ink-muted truncate">{provider.headline || provider.provider_type}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="badge bg-line/60 text-ink-muted">{provider.provider_type}</span>
            {provider.verified ? <span className="badge bg-success-tint text-success">Verified</span> : null}
          </div>
        </div>
      </div>

      {provider.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {provider.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2 py-1 rounded-pill bg-black/[0.03] text-ink-muted">{s}</span>
          ))}
        </div>
      )}

      {provider.matchReasons?.length > 0 && (
        <div className="bg-accent-tint/60 rounded-card px-3 py-2 -mx-0.5">
          <p className="text-xs font-semibold text-accent flex items-center gap-1 mb-1"><Zap size={12} /> Good match because</p>
          <ul className="text-xs text-ink-muted space-y-0.5">
            {provider.matchReasons.slice(0, 2).map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-line mt-auto">
        <RatingStars rating={provider.rating_avg} count={provider.rating_count} />
        <div className="text-right">
          <p className="text-xs text-ink-faint">From</p>
          <p className="text-sm font-semibold text-ink">{formatINR(provider.starting_price)}</p>
        </div>
      </div>
      {provider.location && (
        <p className="text-xs text-ink-faint flex items-center gap-1 -mt-1"><MapPin size={12} /> {provider.location}</p>
      )}
    </Link>
  );
}
