import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Handshake, Clock } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/ui/Avatar';
import RatingStars from '../../components/ui/RatingStars';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, timeAgo } from '../../utils/helpers';

export default function OffersReceived() {
  const [offers, setOffers] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  async function load() {
    const res = await api.get('/offers/received');
    setOffers(res.data.offers);
  }

  useEffect(() => { load(); }, []);

  async function accept(offerId) {
    if (!confirm('Accept this offer? This will start a project and decline other pending offers on the same request.')) return;
    try {
      const res = await api.put(`/offers/${offerId}/accept`);
      toast.success('Offer accepted — project started!');
      navigate(`/projects/${res.data.project.id}`);
    } catch (err) { toast.error(err.message); }
  }

  async function decline(offerId) {
    try { await api.put(`/offers/${offerId}/decline`); toast.success('Offer declined.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (!offers) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-6">Offers</h1>
      {offers.length === 0 ? (
        <EmptyState icon={Handshake} title="No offers yet" description="Once providers respond to your requests, their offers will appear here for you to compare." action={<Link to="/need-something" className="btn-primary">Create a request</Link>} />
      ) : (
        <div className="space-y-4">
          {offers.map((o) => (
            <div key={o.id} className="card p-5">
              <Link to={`/requests/${o.request_id}`} className="text-xs text-accent font-medium hover:underline">{o.request_title}</Link>
              <div className="flex items-start justify-between gap-4 mt-3">
                <Link to={`/providers/${o.provider_id}`} className="flex items-center gap-3">
                  <Avatar seed={o.provider_avatar || o.provider_name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{o.provider_name}</p>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                      <RatingStars rating={o.rating_avg} count={o.rating_count} size={11} />
                      <span>· {o.provider_type}</span>
                    </div>
                  </div>
                </Link>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-lg text-ink">{formatINR(o.price)}</p>
                  <p className="text-xs text-ink-muted flex items-center gap-1 justify-end"><Clock size={11} /> {o.delivery_days} days</p>
                </div>
              </div>
              {o.message && <p className="text-sm text-ink-muted mt-3 leading-relaxed line-clamp-3">{o.message}</p>}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <span className="text-xs text-ink-faint">{timeAgo(o.created_at)}</span>
                </div>
                {o.status === 'pending' && o.request_status === 'open' && (
                  <div className="flex gap-2">
                    <button onClick={() => accept(o.id)} className="btn-primary text-sm py-2">Accept</button>
                    <button onClick={() => decline(o.id)} className="btn-secondary text-sm py-2">Decline</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
