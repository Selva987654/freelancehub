import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, ShieldCheck, Bookmark, MessageSquare, HelpCircle, Star, Briefcase, Globe2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';
import ServiceCard from '../components/cards/ServiceCard';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { PageLoading } from '../components/ui/Loading';
import { formatINR, timeAgo, coverGradient } from '../utils/helpers';

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/providers/${id}`).then((r) => { setData(r.data); setIsSaved(r.data.isSaved); }).finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!user) return navigate('/login');
    setSaving(true);
    try {
      if (isSaved) { await api.delete('/saved', { data: { itemType: 'provider', itemId: id } }); setIsSaved(false); toast.success('Removed from saved.'); }
      else { await api.post('/saved', { itemType: 'provider', itemId: id }); setIsSaved(true); toast.success('Saved to your list.'); }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function sendMessage() {
    if (!user) return navigate('/login');
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const conv = await api.post('/conversations', { otherUserId: id });
      await api.post(`/conversations/${conv.data.conversation.id}/messages`, { content: messageText.trim() });
      toast.success('Message sent!');
      navigate(`/messages/${conv.data.conversation.id}`);
    } catch (err) { toast.error(err.message); } finally { setSending(false); setMessageOpen(false); }
  }

  if (loading) return <PageLoading />;
  if (!data) return null;
  const { provider, services, portfolio, reviews } = data;

  return (
    <div className="container-page py-8 max-w-4xl">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <Avatar seed={provider.avatar_url || provider.name} name={provider.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-extrabold text-2xl text-ink">{provider.name}</h1>
              {provider.verified ? (
                <span className="badge bg-success-tint text-success"><ShieldCheck size={12} /> Verified</span>
              ) : null}
            </div>
            <p className="text-ink-muted mt-1">{provider.headline}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-ink-muted">
              <span className="badge bg-line/60 text-ink">{provider.provider_type}</span>
              <RatingStars rating={provider.rating_avg} count={provider.rating_count} />
              {provider.location && <span className="flex items-center gap-1"><MapPin size={13} /> {provider.location}</span>}
              <span className="flex items-center gap-1"><Clock size={13} /> Responds {provider.response_time?.toLowerCase()}</span>
              <span className={`flex items-center gap-1 ${provider.availability === 'Available' ? 'text-success' : 'text-ink-faint'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> {provider.availability}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-ink-faint">Starting at</p>
            <p className="font-display font-bold text-xl text-ink">{formatINR(provider.starting_price)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-6 pt-6 border-t border-line">
          <button onClick={() => setMessageOpen(true)} className="btn-primary"><MessageSquare size={15} /> Message</button>
          <button onClick={() => { setMessageText(`Hi ${provider.name.split(' ')[0]}, I had a question about one of your services — `); setMessageOpen(true); }} className="btn-secondary">
            <HelpCircle size={15} /> Ask About This
          </button>
          {services.length > 0 && (
            <a href="#services" className="btn-secondary"><Briefcase size={15} /> View Services</a>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-secondary ml-auto">
            <Bookmark size={15} className={isSaved ? 'fill-accent text-accent' : ''} /> {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {provider.about && (
            <section className="card p-6">
              <h2 className="font-display font-bold text-lg text-ink mb-2">About</h2>
              <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">{provider.about}</p>
            </section>
          )}

          <section id="services" className="scroll-mt-24">
            <h2 className="font-display font-bold text-lg text-ink mb-3">Services</h2>
            {services.length === 0 ? (
              <div className="card p-6"><p className="text-sm text-ink-muted">No services listed yet.</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((s) => <ServiceCard key={s.id} service={{ ...s, provider_name: provider.name, rating_avg: provider.rating_avg, rating_count: provider.rating_count }} />)}
              </div>
            )}
          </section>

          {portfolio.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-3">Portfolio</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {portfolio.map((p) => (
                  <div key={p.id} className="card overflow-hidden">
                    <div className="h-32" style={{ background: coverGradient(p.cover_seed) }} />
                    <div className="p-4">
                      <p className="font-semibold text-sm text-ink">{p.title}</p>
                      <p className="text-xs text-ink-muted mt-1">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display font-bold text-lg text-ink mb-3">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <EmptyState icon={Star} title="No reviews yet" description="This provider hasn't completed a reviewed project yet." />
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar seed={r.reviewer_avatar || r.reviewer_name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-ink">{r.reviewer_name}</p>
                          <p className="text-xs text-ink-faint">{timeAgo(r.created_at)}</p>
                        </div>
                      </div>
                      <RatingStars rating={r.rating} showNumber={false} />
                    </div>
                    {r.comment && <p className="text-sm text-ink-muted mt-3 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm text-ink mb-3">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {provider.skills.map((s) => <span key={s.id} className="text-xs px-2.5 py-1 rounded-pill bg-black/[0.03] text-ink-muted">{s.name}</span>)}
              {provider.skills.length === 0 && <p className="text-xs text-ink-faint">No skills listed yet.</p>}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm text-ink mb-3">Experience</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Completed projects</span><span className="font-medium text-ink">{provider.completed_projects}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Typical delivery</span><span className="font-medium text-ink">{provider.delivery_time_days} days</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Works remotely</span><span className="font-medium text-ink">{provider.remote ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
          {Object.keys(provider.social_links || {}).length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-ink mb-3">Links</h3>
              <div className="space-y-2">
                {Object.entries(provider.social_links).map(([k, v]) => (
                  <a key={k} href={v} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-accent hover:underline truncate">
                    <Globe2 size={13} /> {k}
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title={`Message ${provider.name}`}>
        <textarea
          autoFocus
          rows={4}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write your message…"
          className="input resize-none"
        />
        <button onClick={sendMessage} disabled={sending || !messageText.trim()} className="btn-primary w-full mt-4">
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </Modal>
    </div>
  );
}
