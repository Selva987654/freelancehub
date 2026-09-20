import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Clock } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, timeAgo } from '../../utils/helpers';

export default function MyOffers() {
  const [offers, setOffers] = useState(null);
  const toast = useToast();

  async function load() {
    const res = await api.get('/offers/mine');
    setOffers(res.data.offers);
  }

  useEffect(() => { load(); }, []);

  async function withdraw(offerId) {
    if (!confirm('Withdraw this offer?')) return;
    try { await api.put(`/offers/${offerId}/withdraw`); toast.success('Offer withdrawn.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (!offers) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-6">My Offers</h1>

      {offers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No offers sent yet"
          description="Browse open requests and send an offer to start winning work."
          action={<Link to="/dashboard/recommended" className="btn-primary">See recommended requests</Link>}
        />
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/requests/${o.request_id}`} className="text-sm font-semibold text-ink hover:underline line-clamp-2">{o.request_title}</Link>
                  <p className="text-xs text-ink-faint mt-1">Sent {timeAgo(o.created_at)} · client budget {o.budget_range}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-ink">{formatINR(o.price)}</p>
                  <p className="text-xs text-ink-muted flex items-center gap-1 justify-end"><Clock size={11} /> {o.delivery_days} days</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-line">
                <StatusBadge status={o.status} />
                {o.status === 'pending' && (
                  <button onClick={() => withdraw(o.id)} className="btn-ghost text-sm py-1.5">Withdraw</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
