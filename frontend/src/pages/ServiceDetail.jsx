import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Bookmark, MessageSquare, Check, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/ui/Avatar';
import RatingStars from '../components/ui/RatingStars';
import Modal from '../components/ui/Modal';
import { PageLoading } from '../components/ui/Loading';
import { formatINR, coverGradient } from '../utils/helpers';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/services/${id}`).then((r) => { setService(r.data.service); setIsSaved(r.data.isSaved); }).finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!user) return navigate('/login');
    try {
      if (isSaved) { await api.delete('/saved', { data: { itemType: 'service', itemId: id } }); setIsSaved(false); }
      else { await api.post('/saved', { itemType: 'service', itemId: id }); setIsSaved(true); toast.success('Saved to your list.'); }
    } catch (err) { toast.error(err.message); }
  }

  async function sendMessage() {
    if (!user) return navigate('/login');
    setSending(true);
    try {
      const conv = await api.post('/conversations', { otherUserId: service.provider_id });
      await api.post(`/conversations/${conv.data.conversation.id}/messages`, { content: messageText.trim() });
      toast.success('Message sent!');
      navigate(`/messages/${conv.data.conversation.id}`);
    } catch (err) { toast.error(err.message); } finally { setSending(false); setMessageOpen(false); }
  }

  if (loading) return <PageLoading />;
  if (!service) return null;

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="card overflow-hidden">
        <div className="h-44 sm:h-56" style={{ background: coverGradient(service.cover_seed) }} />
        <div className="p-6 sm:p-8">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink leading-tight">{service.title}</h1>
          <Link to={`/providers/${service.provider_id}`} className="flex items-center gap-2.5 mt-4 group w-fit">
            <Avatar seed={service.provider_avatar || service.provider_name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-ink group-hover:underline">{service.provider_name}</p>
              <RatingStars rating={service.rating_avg} count={service.rating_count} size={12} />
            </div>
          </Link>

          {service.description && <p className="text-ink-muted mt-5 leading-relaxed">{service.description}</p>}

          {service.features?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink mb-2.5">What's included</p>
              <ul className="space-y-2">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                    <Check size={15} className="text-success mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.extras?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink mb-2.5">Optional extras</p>
              <ul className="space-y-2">
                {service.extras.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                    <Plus size={15} className="text-accent mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between mt-7 pt-6 border-t border-line">
            <div>
              <p className="text-xs text-ink-faint">Starting at</p>
              <p className="font-display font-bold text-2xl text-ink">{formatINR(service.starting_price)}</p>
              <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5"><Clock size={12} /> {service.delivery_days} day delivery</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={toggleSave} className="btn-secondary"><Bookmark size={15} className={isSaved ? 'fill-accent text-accent' : ''} /></button>
              <button onClick={() => setMessageOpen(true)} className="btn-primary"><MessageSquare size={15} /> Contact provider</button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title={`Ask about "${service.title}"`}>
        <textarea
          autoFocus
          rows={4}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={`Hi ${service.provider_name?.split(' ')[0]}, I'm interested in this service…`}
          className="input resize-none"
        />
        <button onClick={sendMessage} disabled={sending || !messageText.trim()} className="btn-primary w-full mt-4">
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </Modal>
    </div>
  );
}
