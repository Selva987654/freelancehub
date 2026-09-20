import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, Code2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMOS = [
  { persona: 'business', label: 'Explore as Business', icon: Briefcase, desc: 'Arun Kumar, Arun Café' },
  { persona: 'student', label: 'Explore as Student', icon: GraduationCap, desc: 'Rahul Kumar, Student Developer' },
  { persona: 'professional', label: 'Explore as Professional', icon: Code2, desc: 'Arjun Raj, Full Stack Developer' },
  { persona: 'admin', label: 'Explore as Admin', icon: ShieldCheck, desc: 'FreelancerHub Admin' },
];

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(persona) {
    setDemoLoading(persona);
    try {
      const user = await demoLogin(persona);
      toast.success(`Signed in as ${user.name}`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="container-page py-14 max-w-md">
      <h1 className="font-display font-extrabold text-3xl text-ink">Welcome back</h1>
      <p className="text-ink-muted mt-1.5">Log in to continue to FreelancerHub.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Signing in…' : 'Log in'}</button>
      </form>

      <p className="text-sm text-ink-muted mt-4">
        New here? <Link to="/register" className="text-accent font-medium hover:underline">Create an account</Link>
      </p>

      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-line flex-1" />
          <span className="text-xs text-ink-faint uppercase tracking-wide">Or explore instantly</span>
          <div className="h-px bg-line flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMOS.map((d) => (
            <button
              key={d.persona}
              onClick={() => handleDemo(d.persona)}
              disabled={demoLoading !== null}
              className="card p-4 text-left hover:border-accent hover:shadow-soft transition-all disabled:opacity-60"
            >
              <d.icon size={18} className="text-accent mb-2" />
              <p className="text-sm font-semibold text-ink">{demoLoading === d.persona ? 'Signing in…' : d.label}</p>
              <p className="text-xs text-ink-muted mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-3">Demo accounts use the password <code className="bg-black/5 px-1 py-0.5 rounded">demo1234</code> if you'd rather log in manually.</p>
      </div>
    </div>
  );
}
