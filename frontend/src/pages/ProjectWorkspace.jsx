import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Circle, CheckCircle2, Plus, Upload, Link2, Star, X, FileText,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import ChatThread from '../components/ChatThread';
import Modal from '../components/ui/Modal';
import { PageLoading, Spinner } from '../components/ui/Loading';
import { formatINR, timeAgo, formatDate } from '../utils/helpers';

const PROGRESS_STEPS = ['planning', 'working', 'review', 'completed'];
const TABS = ['Overview', 'Milestones', 'Delivery', 'Messages', 'Activity', 'Notes'];

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [conversationId, setConversationId] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (tab !== 'Messages' || !data || conversationId) return;
    const otherUserId = user.role === 'client' ? data.project.provider_id : data.project.client_id;
    api.post('/conversations', { otherUserId, projectId: id }).then((r) => setConversationId(r.data.conversation.id));
  }, [tab, data]);

  if (loading) return <PageLoading />;
  if (!data) return null;
  const { project, milestones, deliveries, activity, reviews } = data;
  const isClient = user.id === project.client_id;
  const otherName = isClient ? project.provider_name : project.client_name;
  const otherAvatar = isClient ? project.provider_avatar : project.client_avatar;
  const iHaveReviewed = reviews.some((r) => r.reviewer_id === user.id);

  async function startWorking() {
    await api.put(`/projects/${id}/status`, { status: 'working' });
    toast.success('Marked as working.');
    load();
  }

  return (
    <div className="container-page py-8 max-w-4xl">
      <div className="card p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-ink-faint">Project</p>
            <h1 className="font-display font-extrabold text-2xl text-ink mt-0.5">{project.title}</h1>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-1.5 mt-6">
          {PROGRESS_STEPS.map((s, i) => {
            const currentIdx = PROGRESS_STEPS.indexOf(project.status);
            const done = i <= currentIdx;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${done ? 'text-accent' : 'text-ink-faint'}`}>
                  {done ? <CheckCircle2 size={16} className="shrink-0" /> : <Circle size={16} className="shrink-0" />}
                  <span className="text-xs font-medium capitalize hidden sm:inline">{s}</span>
                </div>
                {i < PROGRESS_STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${i < currentIdx ? 'bg-accent' : 'bg-line'}`} />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-line flex-wrap">
          <Link to={`/providers/${project.provider_id}`} className="flex items-center gap-2">
            <Avatar seed={project.provider_avatar || project.provider_name} size="sm" />
            <div><p className="text-xs text-ink-faint">Provider</p><p className="text-sm font-medium text-ink">{project.provider_name}</p></div>
          </Link>
          <div className="flex items-center gap-2">
            <Avatar seed={project.client_avatar || project.client_name} size="sm" />
            <div><p className="text-xs text-ink-faint">Client</p><p className="text-sm font-medium text-ink">{project.client_name}</p></div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-ink-faint">Project value</p>
            <p className="font-display font-bold text-lg text-ink">{formatINR(project.price)}</p>
          </div>
        </div>

        {!isClient && project.status === 'planning' && (
          <button onClick={startWorking} className="btn-primary mt-5">Start working</button>
        )}

        {project.status === 'completed' && !iHaveReviewed && (
          <button onClick={() => setReviewOpen(true)} className="btn-primary mt-5"><Star size={15} /> Leave a Review</button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-line mt-7 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="card p-6">
          <h3 className="font-display font-bold text-ink mb-2">Requirement summary</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{data.request?.description}</p>
          {project.notes && (
            <div className="mt-4 pt-4 border-t border-line">
              <h3 className="font-display font-bold text-ink mb-2">Notes</h3>
              <p className="text-sm text-ink-muted whitespace-pre-line">{project.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Milestones' && <MilestonesTab projectId={id} milestones={milestones} isClient={isClient} onChange={load} />}

      {tab === 'Delivery' && <DeliveryTab projectId={id} deliveries={deliveries} isClient={isClient} projectStatus={project.status} onChange={load} />}

      {tab === 'Messages' && (
        <div className="card p-4 sm:p-5">
          {conversationId ? <ChatThread conversationId={conversationId} otherName={otherName} otherAvatar={otherAvatar} compact /> : <div className="flex justify-center py-10"><Spinner /></div>}
        </div>
      )}

      {tab === 'Activity' && (
        <div className="card divide-y divide-line">
          {activity.length === 0 && <p className="text-sm text-ink-muted p-5">No activity yet.</p>}
          {activity.map((a) => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <div>
                <p className="text-sm text-ink">{a.event}</p>
                <p className="text-xs text-ink-faint mt-0.5">{a.actor_name || 'System'} · {timeAgo(a.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Notes' && <NotesTab projectId={id} initialNotes={project.notes} onChange={load} />}

      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} projectId={id} onDone={() => { setReviewOpen(false); load(); toast.success('Review submitted — thank you!'); }} />
    </div>
  );
}

function MilestonesTab({ projectId, milestones, isClient, onChange }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(null);

  async function addMilestone() {
    if (!title.trim()) return;
    setBusy('add');
    try {
      await api.post(`/projects/${projectId}/milestones`, { title, amount: Number(amount) || 0, dueDate: dueDate || undefined });
      setTitle(''); setAmount(''); setDueDate(''); setAdding(false);
      onChange();
    } catch (err) { toast.error(err.message); } finally { setBusy(null); }
  }

  async function updateStatus(msId, status) {
    setBusy(msId);
    try { await api.put(`/projects/milestones/${msId}`, { status }); onChange(); }
    catch (err) { toast.error(err.message); } finally { setBusy(null); }
  }

  const NEXT_STATUS = { pending: 'in_progress', in_progress: 'submitted', submitted: 'approved' };
  const NEXT_LABEL = { pending: 'Start', in_progress: 'Mark submitted', submitted: 'Approve' };

  return (
    <div className="space-y-3">
      {milestones.length === 0 && <p className="text-sm text-ink-muted">No milestones yet.</p>}
      {milestones.map((m) => (
        <div key={m.id} className="card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{m.title}</p>
            <p className="text-xs text-ink-muted mt-0.5">{formatINR(m.amount)}{m.due_date ? ` · due ${formatDate(m.due_date)}` : ''}</p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <StatusBadge status={m.status} />
            {m.status !== 'approved' && (
              (isClient ? m.status === 'submitted' : m.status !== 'submitted') && (
                <button
                  onClick={() => updateStatus(m.id, NEXT_STATUS[m.status])}
                  disabled={busy === m.id}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {busy === m.id ? <Spinner size={13} /> : NEXT_LABEL[m.status]}
                </button>
              )
            )}
          </div>
        </div>
      ))}

      {adding ? (
        <div className="card p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title" className="input" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹" className="input" />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </div>
          <div className="flex gap-2">
            <button onClick={addMilestone} disabled={busy === 'add'} className="btn-primary text-sm py-2">{busy === 'add' ? 'Adding…' : 'Add milestone'}</button>
            <button onClick={() => setAdding(false)} className="btn-ghost text-sm py-2">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-secondary text-sm"><Plus size={14} /> Add milestone</button>
      )}
    </div>
  );
}

function DeliveryTab({ projectId, deliveries, isClient, projectStatus, onChange }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [links, setLinks] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitDelivery() {
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/deliveries`, {
        message, files: [], links: links.split(',').map((l) => l.trim()).filter(Boolean),
      });
      setMessage(''); setLinks('');
      onChange();
      toast.success('Delivery submitted!');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function approve(deliveryId) {
    if (!confirm('Approve this delivery? This will mark the project as completed.')) return;
    try { await api.put(`/projects/deliveries/${deliveryId}/approve`); onChange(); toast.success('Delivery approved — project completed!'); }
    catch (err) { toast.error(err.message); }
  }

  async function requestChanges(deliveryId) {
    const note = prompt('What changes would you like to request?') || '';
    try { await api.put(`/projects/deliveries/${deliveryId}/request-changes`, { note }); onChange(); toast.info('Changes requested.'); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div className="space-y-4">
      {!isClient && projectStatus !== 'completed' && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink mb-3">Submit Delivery</h3>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message about this delivery…" className="input resize-none mb-3" />
          <input value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Links (comma separated) — e.g. live preview URL" className="input mb-3" />
          <button onClick={submitDelivery} disabled={busy || !message.trim()} className="btn-primary text-sm"><Upload size={14} /> {busy ? 'Submitting…' : 'Submit Delivery'}</button>
        </div>
      )}

      {deliveries.length === 0 && <p className="text-sm text-ink-muted">No deliveries submitted yet.</p>}

      {deliveries.map((d) => (
        <div key={d.id} className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <StatusBadge status={d.status} />
            <span className="text-xs text-ink-faint">{timeAgo(d.created_at)}</span>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">{d.message}</p>
          {d.links?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {d.links.map((l) => (
                <a key={l} href={l} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1"><Link2 size={12} /> {l}</a>
              ))}
            </div>
          )}
          {d.files?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {d.files.map((f) => (
                <span key={f.name} className="text-xs text-ink-muted flex items-center gap-1 bg-black/[0.03] rounded-pill px-2.5 py-1"><FileText size={12} /> {f.name}</span>
              ))}
            </div>
          )}
          {isClient && d.status === 'submitted' && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-line">
              <button onClick={() => approve(d.id)} className="btn-primary text-sm py-2">Approve Delivery</button>
              <button onClick={() => requestChanges(d.id)} className="btn-secondary text-sm py-2">Request Changes</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NotesTab({ projectId, initialNotes, onChange }) {
  const toast = useToast();
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try { await api.put(`/projects/${projectId}/notes`, { notes }); toast.success('Notes saved.'); onChange(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  return (
    <div className="card p-5">
      <textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes for this project — reminders, context, anything useful." className="input resize-none" />
      <button onClick={save} disabled={saving} className="btn-primary text-sm mt-3">{saving ? 'Saving…' : 'Save notes'}</button>
    </div>
  );
}

function ReviewModal({ open, onClose, projectId, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/reviews`, { rating, comment });
      onDone();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Leave a review">
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={26} className={n <= rating ? 'fill-warning text-warning' : 'text-line-strong'} />
          </button>
        ))}
      </div>
      <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did it go?" className="input resize-none" />
      <button onClick={submit} disabled={busy} className="btn-primary w-full mt-4">{busy ? 'Submitting…' : 'Submit review'}</button>
    </Modal>
  );
}
