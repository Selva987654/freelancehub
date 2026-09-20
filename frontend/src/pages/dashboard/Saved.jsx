import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/ui/Avatar';
import RatingStars from '../../components/ui/RatingStars';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, coverGradient } from '../../utils/helpers';

const TABS = [
  { key: 'provider', label: 'People' },
  { key: 'service', label: 'Services' },
  { key: 'request', label: 'Requests' },
];

export default function Saved() {
  const [saved, setSaved] = useState(null);
  const [tab, setTab] = useState('provider');
  const toast = useToast();

  async function load() {
    const res = await api.get('/saved/mine');
    setSaved(res.data.saved);
  }

  useEffect(() => { load(); }, []);

  async function remove(itemType, itemId) {
    try { await api.delete('/saved', { data: { itemType, itemId } }); toast.success('Removed from saved.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (!saved) return <PageLoading />;

  const shown = saved.filter((s) => s.item_type === tab);

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Saved</h1>

      <div className="flex items-center gap-1 border-b border-line mb-6">
        {TABS.map((t) => {
          const count = saved.filter((s) => s.item_type === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={tab === 'provider' ? 'No saved providers yet' : tab === 'service' ? 'No saved services yet' : 'No saved requests yet'}
          description="Save things you want to come back to and they'll show up here."
          action={<Link to="/discover" className="btn-primary">Browse Discover</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((s) => (
            <div key={s.id} className="card overflow-hidden relative group">
              <button
                onClick={() => remove(s.item_type, s.item_id)}
                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-surface/90 text-ink-faint hover:text-danger shadow-soft"
                aria-label="Remove from saved"
              >
                <X size={14} />
              </button>

              {s.item_type === 'provider' && (
                <Link to={`/providers/${s.item_id}`} className="block p-5">
                  <div className="flex items-center gap-3">
                    <Avatar seed={s.item.avatar_url || s.item.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{s.item.name}</p>
                      <p className="text-xs text-ink-muted truncate">{s.item.headline || s.item.provider_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
                    <RatingStars rating={s.item.rating_avg} count={s.item.rating_count} size={12} />
                    <span className="text-sm font-semibold text-ink">{formatINR(s.item.starting_price)}</span>
                  </div>
                </Link>
              )}

              {s.item_type === 'service' && (
                <Link to={`/services/${s.item_id}`} className="block">
                  <div className="h-24" style={{ background: coverGradient(s.item.cover_seed || s.item_id) }} />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-ink line-clamp-2">{s.item.title}</p>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line text-sm">
                      <span className="text-xs text-ink-faint">{s.item.delivery_days} day delivery</span>
                      <span className="font-semibold text-ink">{formatINR(s.item.starting_price)}</span>
                    </div>
                  </div>
                </Link>
              )}

              {s.item_type === 'request' && (
                <Link to={`/requests/${s.item_id}`} className="block p-5">
                  <p className="text-sm font-semibold text-ink line-clamp-2">{s.item.title}</p>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line">
                    <span className="text-sm font-semibold text-ink">{s.item.budget_range}</span>
                    <span className="text-xs text-ink-faint capitalize">{s.item.status.replace('_', ' ')}</span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
