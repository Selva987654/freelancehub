import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/cards/RequestCard';
import ProviderCard from '../components/cards/ProviderCard';
import { SkeletonCard } from '../components/ui/Loading';

const OPPORTUNITIES = [
  'College website', 'Mini project', 'Final-year project', 'Presentation design',
  'Documentation', 'UI design', 'Testing & QA', 'Small business website',
];

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/requests?category=student-project&pageSize=6'),
      api.get('/providers?providerType=Student&pageSize=4'),
    ]).then(([r, p]) => {
      setRequests(r.data.requests);
      setStudents(p.data.providers);
    }).finally(() => setLoading(false));
  }, []);

  function joinAsStudent() {
    if (!user) return navigate('/register?role=provider');
    if (user.role === 'provider') return navigate('/dashboard/recommended');
    navigate('/discover?tab=needs');
  }

  return (
    <div>
      <section className="container-page pt-14 pb-10">
        <span className="badge bg-accent-tint text-accent mb-4"><GraduationCap size={13} /> For students</span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink leading-[1.1] max-w-2xl">
          Real projects. Real clients. Real portfolio.
        </h1>
        <p className="text-lg text-ink-muted mt-4 max-w-xl">
          Find small, practical work from real businesses and college teams — build experience and collect reviews while you study. Beginners are treated the same as everyone else here.
        </p>
        <div className="flex flex-wrap gap-3 mt-7">
          <button onClick={joinAsStudent} className="btn-primary text-base px-5 py-3">Start finding work <ArrowRight size={16} /></button>
          <Link to="/discover?tab=needs&category=student-project" className="btn-secondary text-base px-5 py-3">Browse student projects</Link>
        </div>
      </section>

      <section className="container-page pb-14">
        <h2 className="font-display font-bold text-xl text-ink mb-4">Work students take on here</h2>
        <div className="flex flex-wrap gap-2">
          {OPPORTUNITIES.map((o) => (
            <Link key={o} to="/discover?tab=needs" className="chip hover:border-accent hover:text-accent">{o}</Link>
          ))}
        </div>
      </section>

      <section className="bg-surface border-y border-line">
        <div className="container-page py-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-ink">Open student opportunities</h2>
            <Link to="/discover?tab=needs&category=student-project" className="text-sm font-medium text-accent hover:underline hidden sm:block">See all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : requests.length === 0
                ? <p className="text-sm text-ink-muted">No open student projects right now — check back soon, or browse all requests.</p>
                : requests.map((r) => <RequestCard key={r.id} request={r} />)}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="font-display font-bold text-xl text-ink mb-5">Students already working here</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : students.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="card p-8 bg-ink text-center">
          <h2 className="font-display font-bold text-2xl text-white">Build your portfolio with real work</h2>
          <p className="text-white/70 mt-2 max-w-md mx-auto">Create a profile, list what you can help with, and start sending offers today.</p>
          <button onClick={joinAsStudent} className="mt-6 bg-white text-ink font-semibold px-6 py-3 rounded-card inline-flex items-center gap-2 hover:bg-white/90">
            Create your profile <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
