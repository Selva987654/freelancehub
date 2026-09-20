import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Paperclip, X, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import CategoryIcon from '../components/ui/CategoryIcon';
import { Spinner } from '../components/ui/Loading';

const PURPOSES = ['My Business', 'Personal', 'Startup', 'College / Student', 'Organization', 'Other'];
const BUDGETS = ['Under ₹5,000', '₹5,000–₹10,000', '₹10,000–₹25,000', '₹25,000–₹50,000', '₹50,000+', 'Not sure'];
const TIMELINES = ['Urgent', 'This week', '2–4 weeks', '1–2 months', 'Flexible'];

const STEPS = ['category', 'purpose', 'description', 'budget', 'timeline', 'extra', 'review'];
const STEP_LABELS = {
  category: 'What are you trying to get done?', purpose: 'What is it for?', description: 'Explain it in your own words',
  budget: 'Budget', timeline: 'When do you need it?', extra: 'Anything else?', review: 'Review',
};

export default function NeedSomething() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    categorySlug: '', purpose: '', description: location.state?.prefill || '', budgetRange: '', timeline: '', extraNotes: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { request, suggestions }

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data.categories)); }, []);

  const step = STEPS[stepIndex];
  const selectedCategory = categories.find((c) => c.slug === form.categorySlug);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function canProceed() {
    if (step === 'category') return !!form.categorySlug;
    if (step === 'purpose') return !!form.purpose;
    if (step === 'description') return form.description.trim().length >= 15;
    if (step === 'budget') return !!form.budgetRange;
    if (step === 'timeline') return !!form.timeline;
    return true;
  }

  function next() { if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1); }
  function back() { if (stepIndex > 0) setStepIndex((i) => i - 1); }

  async function publish() {
    setSubmitting(true);
    try {
      const res = await api.post('/requests', form);
      const request = res.data.request;

      if (files.length > 0) {
        await Promise.all(files.map((file) => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('requestId', request.id);
          return api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        })).catch(() => toast.error('Your request was published, but one or more attachments failed to upload.'));
      }

      setResult({ request, suggestions: res.data.suggestions });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="container-page py-14 max-w-2xl">
        <div className="w-12 h-12 rounded-full bg-success-tint text-success flex items-center justify-center mb-5">
          <Check size={24} />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-ink">Your request is ready</h1>
        <p className="text-ink-muted mt-1.5">Providers can now see it and send you offers.</p>

        <div className="card p-6 mt-7">
          <p className="font-display font-bold text-lg text-ink">{result.request.title}</p>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">{result.request.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-line">
            <div><p className="text-xs text-ink-faint">Category</p><p className="text-sm font-medium text-ink mt-0.5">{selectedCategory?.name}</p></div>
            <div><p className="text-xs text-ink-faint">Budget</p><p className="text-sm font-medium text-ink mt-0.5">{result.request.budget_range}</p></div>
            <div><p className="text-xs text-ink-faint">Timeline</p><p className="text-sm font-medium text-ink mt-0.5">{result.request.timeline}</p></div>
            <div><p className="text-xs text-ink-faint">Type</p><p className="text-sm font-medium text-ink mt-0.5">{result.request.purpose}</p></div>
          </div>
        </div>

        {result.suggestions?.length > 0 && (
          <div className="mt-8">
            <p className="font-display font-bold text-ink flex items-center gap-1.5"><Sparkles size={16} className="text-accent" /> You may be looking for</p>
            <p className="text-xs text-ink-faint mt-1">Based on your category and description — simple suggestions, not AI-generated.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {result.suggestions.map((s) => (
                <div key={s.title} className="card p-4">
                  <p className="text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-xs text-ink-muted mt-1">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-8">
          <Link to={`/requests/${result.request.id}`} className="btn-primary">View my request</Link>
          <Link to="/dashboard/requests" className="btn-secondary">Go to my requests</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 max-w-2xl">
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-pill ${i <= stepIndex ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </div>

      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">{STEP_LABELS[step]}</h1>

      {step === 'category' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { update('categorySlug', c.slug); }}
              className={`card p-4 flex flex-col items-center text-center gap-2 transition-all ${form.categorySlug === c.slug ? 'border-accent ring-1 ring-accent bg-accent-tint/40' : 'hover:border-line-strong'}`}
            >
              <CategoryIcon name={c.icon} size={20} className={form.categorySlug === c.slug ? 'text-accent' : 'text-ink-muted'} />
              <span className="text-sm font-medium text-ink">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {step === 'purpose' && (
        <div className="grid grid-cols-2 gap-3 mt-7">
          {PURPOSES.map((p) => (
            <button
              key={p}
              onClick={() => update('purpose', p)}
              className={`card p-4 text-sm font-medium text-ink transition-all ${form.purpose === p ? 'border-accent ring-1 ring-accent bg-accent-tint/40' : 'hover:border-line-strong'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {step === 'description' && (
        <div className="mt-7">
          <textarea
            autoFocus
            rows={7}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="e.g. I run a small café and need a website with menu, location, gallery and WhatsApp ordering."
            className="input resize-none"
          />
          <p className="text-xs text-ink-faint mt-2">You don't need to know technical terms. Just explain what you want. ({form.description.trim().length}/15 characters minimum)</p>
        </div>
      )}

      {step === 'budget' && (
        <div className="grid grid-cols-2 gap-3 mt-7">
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => update('budgetRange', b)}
              className={`card p-4 text-sm font-medium text-ink transition-all ${form.budgetRange === b ? 'border-accent ring-1 ring-accent bg-accent-tint/40' : 'hover:border-line-strong'}`}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {step === 'timeline' && (
        <div className="grid grid-cols-2 gap-3 mt-7">
          {TIMELINES.map((t) => (
            <button
              key={t}
              onClick={() => update('timeline', t)}
              className={`card p-4 text-sm font-medium text-ink transition-all ${form.timeline === t ? 'border-accent ring-1 ring-accent bg-accent-tint/40' : 'hover:border-line-strong'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {step === 'extra' && (
        <div className="mt-7 space-y-4">
          <textarea
            rows={4}
            value={form.extraNotes}
            onChange={(e) => update('extraNotes', e.target.value)}
            placeholder="Any preferences, constraints, or extra context providers should know? (optional)"
            className="input resize-none"
          />
          <div>
            <label className="label">Attachments <span className="text-ink-faint font-normal">(optional)</span></label>
            <label className="card flex items-center justify-center gap-2 py-6 cursor-pointer text-sm text-ink-muted hover:border-accent border-dashed">
              <Paperclip size={16} /> Click to attach files
              <input type="file" multiple className="hidden" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files)])} />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-black/[0.03] rounded-card px-3 py-2">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setFiles((fs) => fs.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger"><X size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="card p-6 mt-7 space-y-4">
          <div><p className="text-xs text-ink-faint">Category</p><p className="text-sm font-medium text-ink mt-0.5">{selectedCategory?.name}</p></div>
          <div><p className="text-xs text-ink-faint">What it's for</p><p className="text-sm font-medium text-ink mt-0.5">{form.purpose}</p></div>
          <div><p className="text-xs text-ink-faint">Description</p><p className="text-sm text-ink mt-0.5 leading-relaxed">{form.description}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-ink-faint">Budget</p><p className="text-sm font-medium text-ink mt-0.5">{form.budgetRange}</p></div>
            <div><p className="text-xs text-ink-faint">Timeline</p><p className="text-sm font-medium text-ink mt-0.5">{form.timeline}</p></div>
          </div>
          {form.extraNotes && <div><p className="text-xs text-ink-faint">Extra notes</p><p className="text-sm text-ink mt-0.5">{form.extraNotes}</p></div>}
          {files.length > 0 && <div><p className="text-xs text-ink-faint">Attachments</p><p className="text-sm text-ink mt-0.5">{files.length} file(s)</p></div>}
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button onClick={back} disabled={stepIndex === 0} className="btn-ghost disabled:opacity-0">
          <ArrowLeft size={16} /> Back
        </button>
        {step === 'review' ? (
          <button onClick={publish} disabled={submitting} className="btn-primary px-6">
            {submitting ? <Spinner size={16} className="text-white" /> : <>Publish Request <ArrowRight size={16} /></>}
          </button>
        ) : (
          <button onClick={next} disabled={!canProceed()} className="btn-primary px-6">
            Continue <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
