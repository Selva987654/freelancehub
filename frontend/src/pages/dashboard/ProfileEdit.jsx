import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/ui/Avatar';
import { PageLoading } from '../../components/ui/Loading';

export default function ProfileEdit() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'provider') {
      api.get('/skills').then((r) => setAllSkills(r.data.skills));
      const pp = user.providerProfile || {};
      setSelectedSkills((pp.skills || []).map((s) => s.id));
      setForm({
        name: user.name, phone: user.phone || '',
        providerType: pp.provider_type || 'Beginner', headline: pp.headline || '', about: pp.about || '',
        startingPrice: pp.starting_price ?? 0, deliveryTimeDays: pp.delivery_time_days ?? 7,
        availability: pp.availability || 'Available', location: pp.location || '', remote: !!pp.remote,
        responseTime: pp.response_time || 'Within a day',
      });
    } else {
      const cp = user.clientProfile || {};
      setForm({
        name: user.name, phone: user.phone || '',
        businessName: cp.business_name || '', businessType: cp.business_type || '', location: cp.location || '', about: cp.about || '',
      });
    }
  }, [user]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function toggleSkill(id) {
    setSelectedSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (user.role === 'provider') {
        payload.skillIds = selectedSkills;
        payload.startingPrice = Number(form.startingPrice) || 0;
        payload.deliveryTimeDays = Number(form.deliveryTimeDays) || 7;
      }
      await api.put('/profile', payload);
      await refreshUser();
      toast.success('Profile updated.');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  if (!form) return <PageLoading />;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-extrabold text-2xl text-ink mb-6">Profile</h1>

      <form onSubmit={save} className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-5">
            <Avatar seed={user.avatar_url || form.name} name={form.name} size="xl" />
            <div>
              <p className="text-sm font-semibold text-ink">{form.name}</p>
              <p className="text-xs text-ink-muted capitalize">{user.role} account</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" placeholder="+91 …" />
            </div>
          </div>
        </div>

        {user.role === 'client' ? (
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-ink">Business details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Business / organisation name</label>
                <input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Type</label>
                <input value={form.businessType} onChange={(e) => update('businessType', e.target.value)} className="input" placeholder="e.g. Café, Retail, Startup" />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <input value={form.location} onChange={(e) => update('location', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">About</label>
              <textarea rows={3} value={form.about} onChange={(e) => update('about', e.target.value)} className="input resize-none" />
            </div>
          </div>
        ) : (
          <>
            <div className="card p-6 space-y-4">
              <h2 className="font-display font-bold text-ink">What you can help with</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Which best describes you?</label>
                  <select value={form.providerType} onChange={(e) => update('providerType', e.target.value)} className="input">
                    {['Student', 'Beginner', 'Professional', 'Agency'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Availability</label>
                  <select value={form.availability} onChange={(e) => update('availability', e.target.value)} className="input">
                    {['Available', 'Busy', 'Not Available'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Short introduction</label>
                <input value={form.headline} onChange={(e) => update('headline', e.target.value)} className="input" placeholder="e.g. Full Stack Developer — Business Websites" />
              </div>
              <div>
                <label className="label">About</label>
                <textarea rows={4} value={form.about} onChange={(e) => update('about', e.target.value)} className="input resize-none" placeholder="Tell people what you do and who you like working with." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Starting price (₹)</label>
                  <input type="number" value={form.startingPrice} onChange={(e) => update('startingPrice', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Typical delivery (days)</label>
                  <input type="number" value={form.deliveryTimeDays} onChange={(e) => update('deliveryTimeDays', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input value={form.location} onChange={(e) => update('location', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Response time</label>
                  <select value={form.responseTime} onChange={(e) => update('responseTime', e.target.value)} className="input">
                    {['Within a few hours', 'Within a day', 'Within 2 days'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.remote} onChange={(e) => update('remote', e.target.checked)} className="rounded border-line-strong" />
                Available for remote work
              </label>
            </div>

            <div className="card p-6">
              <h2 className="font-display font-bold text-ink mb-1">Skills</h2>
              <p className="text-xs text-ink-muted mb-4">Pick everything you're comfortable with — this helps us match you to the right requests.</p>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSkill(s.id)}
                    className={`chip ${selectedSkills.includes(s.id) ? 'chip-selected' : 'hover:border-ink-faint'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={saving} className="btn-primary px-6 py-3">{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
