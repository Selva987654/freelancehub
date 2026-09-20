import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, Bookmark, Handshake, Lock, Sparkles, ShieldCheck, ChevronRight, X, Plus, MessageSquare,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';
import CategoryIcon from '../components/ui/CategoryIcon';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { PageLoading, Spinner } from '../components/ui/Loading';
import { formatINR, timeAgo } from '../utils/helpers';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [myOffer, setMyOffer] = useState(null);
  const [offers, setOffers] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const isOwner = user && request && user.id === request.client_id;
  const isProvider = user?.role === 'provider';

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.request);
      setIsSaved(res.data.isSaved);
      setMyOffer(res.data.myOffer);

      if (user && user.id === res.data.request.client_id) {
        const off = await api.get(`/requests/${id}/offers`);
        setOffers(off.data.offers);
      }
      const rec = await api.get(`/requests/${id}/recommended-providers`);
      setRecommended(rec.data.providers);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  async function toggleSave() {
    if (!user) return navigate('/login');
    try {
      if (isSaved) { await api.delete('/saved', { data: { itemType: 'request', itemId: id } }); setIsSaved(false); }
      else { await api.post('/saved', { itemType: 'request', itemId: id }); setIsSaved(true); toast.success('Saved.'); }
    } catch (err) { toast.error(err.message); }
  }

  async function closeRequest() {
    if (!confirm('Close this request? Providers will no longer be able to send offers.')) return;
    try {
      await api.put(`/requests/${id}/close`);
      toast.success('Request closed.');
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function acceptOffer(offerId) {
    if (!confirm('Accept this offer? This will start a project and decline all other pending offers.')) return;
    try {
      const res = await api.put(`/offers/${offerId}/accept`);
      toast.success('Offer accepted — project started!');
      navigate(`/projects/${res.data.project.id}`);
    } catch (err) { toast.error(err.message); }
  }

  async function declineOffer(offerId) {
    try {
      await api.put(`/offers/${offerId}/decline`);
      toast.success('Offer declined.');
      load();
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <PageLoading />;
  if (!request) return null;

  return (
    <div className="container-page py-8 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-4">
        <Link to="/discover?tab=needs" className="hover:text-ink">Discover</Link>
        <ChevronRight size={14} />
        <span className="text-ink-faint">Request</span>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <CategoryIcon name={request.category_icon} size={16} />
            </span>
            {request.category_name || 'Other'}
          </div>
          <StatusBadge status={request.status} />
        </div>

        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 leading-tight">{request.title}</h1>

        <Link to={`/providers/${request.client_id}`} className="flex items-center gap-2.5 mt-4 w-fit">
          <Avatar seed={request.client_avatar || request.client_name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-ink">{request.client_name}</p>
            <p className="text-xs text-ink-faint">Posted {timeAgo(request.created_at)}</p>
          </div>
        </Link>

        <p className="text-ink-muted mt-5 leading-relaxed whitespace-pre-line">{request.description}</p>

        {request.extra_notes && (
          <div className="mt-4 bg-black/[0.025] rounded-card p-4">
            <p className="text-xs font-semibold text-ink-muted mb-1">Anything else</p>
            <p className="text-sm text-ink-muted">{request.extra_notes}</p>
          </div>
        )}

        {request.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {request.skills.map((s) => <span key={s.id} className="text-xs px-2.5 py-1 rounded-pill bg-black/[0.03] text-ink-muted">{s.name}</span>)}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-line">
          <div><p className="text-xs text-ink-faint">Budget</p><p className="text-sm font-semibold text-ink mt-0.5">{request.budget_range}</p></div>
          <div><p className="text-xs text-ink-faint">Timeline</p><p className="text-sm font-semibold text-ink mt-0.5">{request.timeline}</p></div>
          <div><p className="text-xs text-ink-faint">It's for</p><p className="text-sm font-semibold text-ink mt-0.5">{request.purpose || '—'}</p></div>
          <div><p className="text-xs text-ink-faint">Offers</p><p className="text-sm font-semibold text-ink mt-0.5 flex items-center gap-1"><Handshake size={13} /> {request.offer_count ?? offers?.length ?? 0}</p></div>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-6 pt-6 border-t border-line">
          {isOwner ? (
            request.status === 'open' && <button onClick={closeRequest} className="btn-secondary"><Lock size={15} /> Close request</button>
          ) : isProvider ? (
            myOffer ? (
              <div className="flex items-center gap-2 text-sm"><StatusBadge status={myOffer.status} /> <span className="text-ink-muted">You sent an offer — {formatINR(myOffer.price)}</span></div>
            ) : request.status === 'open' ? (
              <button onClick={() => setOfferModalOpen(true)} className="btn-primary"><Handshake size={15} /> Send Offer</button>
            ) : (
              <p className="text-sm text-ink-faint">This request is no longer accepting offers.</p>
            )
          ) : !user ? (
            <button onClick={() => navigate('/login')} className="btn-primary">Log in to respond</button>
          ) : null}
          <button onClick={toggleSave} className="btn-secondary"><Bookmark size={15} className={isSaved ? 'fill-accent text-accent' : ''} /> {isSaved ? 'Saved' : 'Save'}</button>
        </div>
      </div>

      {/* Offers — visible to the owner only */}
      {isOwner && (
        <section className="mt-8">
          <h2 className="font-display font-bold text-xl text-ink mb-4">Offers ({offers?.length || 0})</h2>
          {!offers || offers.length === 0 ? (
            <EmptyState icon={Handshake} title="No offers yet" description="Providers matching your request will send offers here. Check back soon." />
          ) : (
            <div className="space-y-4">
              {offers.map((o) => <OfferRow key={o.id} offer={o} onAccept={acceptOffer} onDecline={declineOffer} requestOpen={request.status === 'open'} />)}
            </div>
          )}
        </section>
      )}

      {/* Recommended providers */}
      {recommended.length > 0 && request.status === 'open' && (
        <section className="mt-8">
          <h2 className="font-display font-bold text-xl text-ink mb-1 flex items-center gap-2"><Sparkles size={17} className="text-accent" /> Recommended providers</h2>
          <p className="text-xs text-ink-faint mb-4">Ranked using a simple, explainable matching system — not AI.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {recommended.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/providers/${p.id}`} className="card p-4 flex items-center gap-3 hover:shadow-lift transition-all">
                <Avatar seed={p.avatar_url || p.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                  <p className="text-xs text-ink-muted truncate">{p.matchReasons?.[0]}</p>
                </div>
                <RatingStars rating={p.rating_avg} showNumber={false} size={12} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <SendOfferModal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        requestId={id}
        onSent={() => { setOfferModalOpen(false); load(); toast.success('Offer sent!'); }}
      />
    </div>
  );
}

function OfferRow({ offer, onAccept, onDecline, requestOpen }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/providers/${offer.provider_id}`} className="flex items-center gap-3">
          <Avatar seed={offer.provider_avatar || offer.provider_name} size="md" />
          <div>
            <p className="text-sm font-semibold text-ink">{offer.provider_name}</p>
            <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
              <RatingStars rating={offer.rating_avg} count={offer.rating_count} size={11} />
              <span>· {offer.provider_type}</span>
            </div>
          </div>
        </Link>
        <div className="text-right shrink-0">
          <p className="font-display font-bold text-lg text-ink">{formatINR(offer.price)}</p>
          <p className="text-xs text-ink-muted flex items-center gap-1 justify-end"><Clock size={11} /> {offer.delivery_days} days</p>
        </div>
      </div>

      {offer.message && <p className="text-sm text-ink-muted mt-3 leading-relaxed">{offer.message}</p>}

      <button onClick={() => setExpanded((e) => !e)} className="text-xs text-accent font-medium mt-2 hover:underline">
        {expanded ? 'Hide details' : 'Show what\u2019s included'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {offer.includes?.length > 0 && (
            <ul className="space-y-1.5">
              {offer.includes.map((f) => <li key={f} className="text-sm text-ink-muted flex gap-2"><span className="text-success">✓</span> {f}</li>)}
            </ul>
          )}
          {offer.milestones?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-1.5">Milestones</p>
              {offer.milestones.map((m, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-line last:border-0">
                  <span className="text-ink">{m.title}</span><span className="text-ink-muted">{formatINR(m.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <StatusBadge status={offer.status} className="mt-3" />

      {offer.status === 'pending' && requestOpen && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-line">
          <button onClick={() => onAccept(offer.id)} className="btn-primary text-sm py-2">Accept</button>
          <button onClick={() => onDecline(offer.id)} className="btn-secondary text-sm py-2">Decline</button>
          <Link to={`/providers/${offer.provider_id}`} className="btn-ghost text-sm py-2 ml-auto"><MessageSquare size={14} /> View profile</Link>
        </div>
      )}
    </div>
  );
}

function SendOfferModal({ open, onClose, requestId, onSent }) {
  const toast = useToast();
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [message, setMessage] = useState('');
  const [includes, setIncludes] = useState(['']);
  const [milestones, setMilestones] = useState([{ title: '', amount: '' }]);
  const [portfolioLink, setPortfolioLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateInclude(i, v) { setIncludes((arr) => arr.map((x, idx) => (idx === i ? v : x))); }
  function updateMilestone(i, field, v) { setMilestones((arr) => arr.map((m, idx) => (idx === i ? { ...m, [field]: v } : m))); }

  async function submit() {
    if (!price || !deliveryDays) { toast.error('Please add a price and delivery time.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/offers/requests/${requestId}/offers`, {
        price: Number(price), deliveryDays: Number(deliveryDays), message,
        includes: includes.filter((i) => i.trim()),
        milestones: milestones.filter((m) => m.title.trim()).map((m) => ({ title: m.title, amount: Number(m.amount) || 0 })),
        portfolioExample: portfolioLink || undefined,
      });
      onSent();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send an offer" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="8000" />
          </div>
          <div>
            <label className="label">Delivery time (days)</label>
            <input type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} className="input" placeholder="7" />
          </div>
        </div>
        <div>
          <label className="label">Message</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="input resize-none" placeholder="Introduce yourself and explain your approach…" />
        </div>
        <div>
          <label className="label">What's included</label>
          {includes.map((v, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={v} onChange={(e) => updateInclude(i, e.target.value)} className="input" placeholder="e.g. Homepage with menu" />
              {includes.length > 1 && <button onClick={() => setIncludes((arr) => arr.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger px-1"><X size={16} /></button>}
            </div>
          ))}
          <button onClick={() => setIncludes((arr) => [...arr, ''])} className="text-xs text-accent font-medium flex items-center gap-1"><Plus size={13} /> Add item</button>
        </div>
        <div>
          <label className="label">Milestones <span className="text-ink-faint font-normal">(optional)</span></label>
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)} className="input flex-1" placeholder="Milestone title" />
              <input type="number" value={m.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)} className="input w-28" placeholder="₹" />
              {milestones.length > 1 && <button onClick={() => setMilestones((arr) => arr.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger px-1"><X size={16} /></button>}
            </div>
          ))}
          <button onClick={() => setMilestones((arr) => [...arr, { title: '', amount: '' }])} className="text-xs text-accent font-medium flex items-center gap-1"><Plus size={13} /> Add milestone</button>
        </div>
        <div>
          <label className="label">Portfolio example link <span className="text-ink-faint font-normal">(optional)</span></label>
          <input value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} className="input" placeholder="https://…" />
        </div>
        <button onClick={submit} disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? <Spinner size={16} className="text-white" /> : 'Send Offer'}
        </button>
      </div>
    </Modal>
  );
}
