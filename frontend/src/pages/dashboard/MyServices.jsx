import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading, Spinner } from '../../components/ui/Loading';
import { formatINR, coverGradient } from '../../utils/helpers';

export default function MyServices() {
  const [services, setServices] = useState(null);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  async function load() {
    const res = await api.get('/services/mine');
    setServices(res.data.services);
  }

  useEffect(() => {
    load();
    api.get('/categories').then((r) => setCategories(r.data.categories));
  }, []);

  async function remove(id) {
    if (!confirm('Remove this service?')) return;
    try { await api.delete(`/services/${id}`); toast.success('Service removed.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (!services) return <PageLoading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-ink">Services</h1>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={15} /> Add Service</button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No services yet"
          description="Publish a ready-to-start service so clients can hire you directly without posting a request."
          action={<button onClick={() => setOpen(true)} className="btn-primary">Add your first service</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="card overflow-hidden relative">
              <button onClick={() => remove(s.id)} className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-surface/90 text-ink-faint hover:text-danger shadow-soft" aria-label="Remove service">
                <Trash2 size={14} />
              </button>
              <div className="h-24" style={{ background: coverGradient(s.cover_seed || s.id) }} />
              <div className="p-4">
                <p className="text-sm font-semibold text-ink line-clamp-2">{s.title}</p>
                <p className="text-xs text-ink-muted mt-1 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line">
                  <span className="text-xs text-ink-faint">{s.delivery_days} day delivery</span>
                  <span className="text-sm font-semibold text-ink">{formatINR(s.starting_price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddServiceModal open={open} onClose={() => setOpen(false)} categories={categories} onAdded={() => { setOpen(false); load(); toast.success('Service published!'); }} />
    </div>
  );
}

function AddServiceModal({ open, onClose, categories, onAdded }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', startingPrice: '', deliveryDays: '' });
  const [features, setFeatures] = useState(['']);
  const [extras, setExtras] = useState(['']);
  const [busy, setBusy] = useState(false);

  function update(f, v) { setForm((s) => ({ ...s, [f]: v })); }

  async function submit() {
    if (!form.title.trim() || !form.startingPrice || !form.deliveryDays) {
      toast.error('Please add a title, price and delivery time.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/services', {
        ...form,
        categoryId: form.categoryId || undefined,
        startingPrice: Number(form.startingPrice),
        deliveryDays: Number(form.deliveryDays),
        features: features.filter((f) => f.trim()),
        extras: extras.filter((f) => f.trim()),
      });
      setForm({ title: '', description: '', categoryId: '', startingPrice: '', deliveryDays: '' });
      setFeatures(['']); setExtras(['']);
      onAdded();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a service" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="label">Service title</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} className="input" placeholder="e.g. Business Website" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className="input resize-none" placeholder="What does this service give the client?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Starting price (₹)</label>
            <input type="number" value={form.startingPrice} onChange={(e) => update('startingPrice', e.target.value)} className="input" placeholder="8000" />
          </div>
          <div>
            <label className="label">Delivery (days)</label>
            <input type="number" value={form.deliveryDays} onChange={(e) => update('deliveryDays', e.target.value)} className="input" placeholder="7" />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} className="input">
            <option value="">Choose a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <ListEditor label="What's included" items={features} setItems={setFeatures} placeholder="e.g. Mobile-friendly design" />
        <ListEditor label="Optional extras" items={extras} setItems={setExtras} placeholder="e.g. Extra pages" />

        <button onClick={submit} disabled={busy} className="btn-primary w-full py-3">{busy ? <Spinner size={16} className="text-white" /> : 'Publish service'}</button>
      </div>
    </Modal>
  );
}

function ListEditor({ label, items, setItems, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      {items.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input value={v} onChange={(e) => setItems((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))} className="input" placeholder={placeholder} />
          {items.length > 1 && (
            <button onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger px-1"><X size={16} /></button>
          )}
        </div>
      ))}
      <button onClick={() => setItems((arr) => [...arr, ''])} className="text-xs text-accent font-medium flex items-center gap-1"><Plus size={13} /> Add item</button>
    </div>
  );
}
