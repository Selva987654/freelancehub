import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'provider' ? 'provider' : 'client');
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', businessType: '', location: '', providerType: 'Beginner' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.success(`Welcome to FreelancerHub, ${user.name.split(' ')[0]}!`);
      const next = params.get('next');
      navigate(next || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-14 max-w-md">
      <h1 className="font-display font-extrabold text-3xl text-ink">Create your account</h1>
      <p className="text-ink-muted mt-1.5">It only takes a minute.</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => setRole('client')}
          className={`card p-4 text-left transition-all ${role === 'client' ? 'border-accent ring-1 ring-accent bg-accent-tint/40' : 'hover:border-line-strong'}`}
        >
          <Briefcase size={18} className={role === 'client' ? 'text-accent' : 'text-ink-muted'} />
          <p className="text-sm font-semibold text-ink mt-2">I need something</p>
          <p className="text-xs text-ink-muted mt-0.5">Post what you need done</p>
        </button>
        <button
          onClick={() => setRole('provider')}
          className={`card p-4 text-left transition-all ${role === 'provider' ? 'border-accent ring-1 ring-accent bg-accent-tint/40' : 'hover:border-line-strong'}`}
        >
          <Wrench size={18} className={role === 'provider' ? 'text-accent' : 'text-ink-muted'} />
          <p className="text-sm font-semibold text-ink mt-2">I can help</p>
          <p className="text-xs text-ink-muted mt-0.5">Offer your skills or services</p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} className="input" placeholder="Full name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} className="input" placeholder="At least 6 characters" />
        </div>

        {role === 'client' ? (
          <>
            <div>
              <label className="label" htmlFor="businessName">Business or organisation name <span className="text-ink-faint font-normal">(optional)</span></label>
              <input id="businessName" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} className="input" placeholder="e.g. Arun Café" />
            </div>
            <div>
              <label className="label" htmlFor="location">Location <span className="text-ink-faint font-normal">(optional)</span></label>
              <input id="location" value={form.location} onChange={(e) => update('location', e.target.value)} className="input" placeholder="City, State" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="providerType">Which best describes you?</label>
              <select id="providerType" value={form.providerType} onChange={(e) => update('providerType', e.target.value)} className="input">
                <option>Student</option>
                <option>Beginner</option>
                <option>Professional</option>
                <option>Agency</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="location2">Location <span className="text-ink-faint font-normal">(optional)</span></label>
              <input id="location2" value={form.location} onChange={(e) => update('location', e.target.value)} className="input" placeholder="City, State" />
            </div>
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Creating account…' : 'Create account'}</button>
      </form>

      <p className="text-sm text-ink-muted mt-4">
        Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
