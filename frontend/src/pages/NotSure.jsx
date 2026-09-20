import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Loading';

const EXAMPLE = 'I have a small clothing shop. Customers currently call me to ask about products.';

export default function NotSure() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [text, setText] = useState('');
  const [solutions, setSolutions] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getSuggestions() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/guidance', { text });
      setSolutions(res.data.solutions);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  function startRequest() {
    if (!user) return navigate('/register?role=client&next=/need-something');
    if (user.role !== 'client') return navigate('/discover?tab=needs');
    navigate('/need-something', { state: { prefill: text } });
  }

  return (
    <div className="container-page py-14 max-w-2xl">
      <span className="badge bg-accent-tint text-accent mb-4"><Lightbulb size={13} /> Guided help</span>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight">Not sure what would work best?</h1>
      <p className="text-ink-muted mt-3">Describe your situation in plain language and we'll suggest a few things that usually help.</p>

      <div className="card p-5 sm:p-6 mt-7">
        <label className="label" htmlFor="situation">Tell us about your situation.</label>
        <textarea
          id="situation"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          className="input resize-none"
        />
        <div className="flex items-center justify-between mt-3 gap-3">
          <button onClick={() => setText(EXAMPLE)} className="text-xs text-accent font-medium hover:underline">Use the example</button>
          <button onClick={getSuggestions} disabled={loading || !text.trim()} className="btn-primary">
            {loading ? <Spinner size={15} className="text-white" /> : <>See suggestions <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>

      {solutions && (
        <div className="mt-9">
          <h2 className="font-display font-bold text-xl text-ink">Possible solutions</h2>
          <p className="text-xs text-ink-faint mt-1 mb-4">Based on keywords in what you wrote — simple rules, not AI.</p>
          <div className="space-y-3">
            {solutions.map((s) => (
              <div key={s.title} className="card p-5">
                <p className="font-display font-bold text-ink">{s.title}</p>
                <p className="text-sm text-ink-muted mt-1.5">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="card p-6 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-display font-bold text-ink">Ready to find someone?</p>
              <p className="text-sm text-ink-muted mt-1">We'll carry over what you wrote so you don't have to type it again.</p>
            </div>
            <button onClick={startRequest} className="btn-primary shrink-0">Post a request <ArrowRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
