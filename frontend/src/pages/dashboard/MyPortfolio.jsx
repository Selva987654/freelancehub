import { useEffect, useState } from 'react';
import { GalleryHorizontalEnd, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';
import { coverGradient } from '../../utils/helpers';

export default function MyPortfolio() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', link: '' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function load() {
    const res = await api.get('/portfolio/mine');
    setItems(res.data.items);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.title.trim()) { toast.error('Please add a title.'); return; }
    setBusy(true);
    try {
      await api.post('/portfolio', form);
      setForm({ title: '', description: '', link: '' });
      setOpen(false);
      load();
      toast.success('Added to your portfolio.');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Remove this portfolio item?')) return;
    try { await api.delete(`/portfolio/${id}`); load(); toast.success('Removed.'); }
    catch (err) { toast.error(err.message); }
  }

  if (!items) return <PageLoading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-ink">Portfolio</h1>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={15} /> Add Portfolio</button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={GalleryHorizontalEnd}
          title="Your portfolio is empty"
          description="Show work you're proud of — even class projects count. Clients look at this before hiring."
          action={<button onClick={() => setOpen(true)} className="btn-primary">Add your first piece</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="card overflow-hidden relative">
              <button onClick={() => remove(p.id)} className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-surface/90 text-ink-faint hover:text-danger shadow-soft" aria-label="Remove">
                <Trash2 size={14} />
              </button>
              <div className="h-28" style={{ background: coverGradient(p.cover_seed) }} />
              <div className="p-4">
                <p className="text-sm font-semibold text-ink">{p.title}</p>
                <p className="text-xs text-ink-muted mt-1 line-clamp-3">{p.description}</p>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline mt-2 inline-block">View project</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add portfolio piece">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. College Fest 2025 Website" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input resize-none" placeholder="What was it, and what did you do?" />
          </div>
          <div>
            <label className="label">Link <span className="text-ink-faint font-normal">(optional)</span></label>
            <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} className="input" placeholder="https://…" />
          </div>
          <button onClick={add} disabled={busy} className="btn-primary w-full">{busy ? 'Adding…' : 'Add to portfolio'}</button>
        </div>
      </Modal>
    </div>
  );
}
