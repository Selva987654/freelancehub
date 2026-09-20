import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, MessageSquareText, Users2, Handshake, CheckCircle2, ShieldCheck, Clock, Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CategoryIcon from '../components/ui/CategoryIcon';
import ProviderCard from '../components/cards/ProviderCard';
import ServiceCard from '../components/cards/ServiceCard';
import RequestCard from '../components/cards/RequestCard';
import RatingStars from '../components/ui/RatingStars';
import Avatar from '../components/ui/Avatar';
import { SkeletonCard } from '../components/ui/Loading';

const EXAMPLES = [
  'I run a small café and need a website with menu, location, gallery and WhatsApp ordering.',
  'I want an online store for my clothing shop.',
  'I need help with my final-year project.',
  'I want a portfolio website.',
  'I need someone to redesign my existing site.',
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/services?sort=newest&pageSize=4'),
      api.get('/providers?sort=rating&pageSize=4'),
      api.get('/requests?pageSize=4'),
    ]).then(([c, s, p, r]) => {
      setCategories(c.data.categories);
      setServices(s.data.services);
      setProviders(p.data.providers);
      setRequests(r.data.requests);
    }).finally(() => setLoading(false));
  }, []);

  function goNeedSomething(prefill) {
    if (!user) return navigate('/register?role=client&next=/need-something');
    if (user.role !== 'client') return navigate('/need-something');
    navigate('/need-something', { state: { prefill } });
  }

  function goCanHelp() {
    if (!user) return navigate('/register?role=provider');
    if (user.role === 'provider') return navigate('/dashboard/recommended');
    navigate('/discover?tab=needs');
  }

  return (
    <div>
      {/* HERO */}
      <section className="container-page pt-10 pb-14 sm:pt-16 sm:pb-20">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] gap-10 xl:gap-16 items-center">
        <div className="max-w-3xl">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-ink tracking-tight">
            Tell us what you need.
            <br />Find someone who can make it happen.
          </h1>
          <p className="text-lg text-ink-muted mt-5 max-w-2xl">
            From business websites and digital services to student projects and creative work, explain what you need in your own words and connect with the right person.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={() => goNeedSomething()} className="btn-primary text-base px-5 py-3">
              I Need Something <ArrowRight size={17} />
            </button>
            <button onClick={goCanHelp} className="btn-secondary text-base px-5 py-3">
              I Can Help
            </button>
          </div>
        </div>

        <div className="hidden lg:block relative">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80"
            alt="Freelancers collaborating around a table"
            loading="eager"
            className="w-full aspect-[4/3] object-cover rounded-card shadow-lift"
          />
          <div className="absolute -bottom-5 -left-5 card px-4 py-3 shadow-soft max-w-[220px]">
            <p className="text-sm font-semibold text-ink">Find the right person</p>
            <p className="text-xs text-ink-muted mt-1">From your first idea to the finished project.</p>
          </div>
        </div>
        </div>

        <div className="card mt-10 max-w-3xl p-5 sm:p-6 shadow-soft">
          <label className="label">What are you trying to get done?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLES[exampleIndex]}
            rows={3}
            className="input resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-ink-faint">You don't need any technical terms — just explain what you want.</p>
            <button
              onClick={() => goNeedSomething(text)}
              className="btn-primary shrink-0"
            >
              Get started <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-line bg-surface">
        <div className="container-page py-14">
          <h2 className="font-display font-bold text-2xl text-ink mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: MessageSquareText, title: 'Explain what you need', text: 'Answer a few simple questions in your own words — no technical terms required.' },
              { icon: Users2, title: 'Compare people who can help', text: 'See matched providers and offers, with clear pricing and delivery times.' },
              { icon: Handshake, title: 'Work together until it\u2019s done', text: 'Message, track milestones and approve delivery — all in one place.' },
            ].map((s, i) => (
              <div key={s.title} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-card bg-accent-tint text-accent flex items-center justify-center">
                  <s.icon size={19} />
                </div>
                <p className="font-display font-bold text-ink">{s.title}</p>
                <p className="text-sm text-ink-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR NEEDS */}
      <section className="container-page py-14">
        <h2 className="font-display font-bold text-2xl text-ink mb-6">Popular needs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/discover?tab=needs&category=${c.slug}`}
              className="card p-4 flex flex-col items-center text-center gap-2 hover:shadow-lift hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-full bg-accent-tint text-accent flex items-center justify-center">
                <CategoryIcon name={c.icon} size={18} />
              </div>
              <span className="text-sm font-medium text-ink">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BUSINESS SOLUTIONS */}
      <section className="bg-accent text-white">
        <div className="container-page py-14 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl leading-tight">Need to get your business online?</h2>
            <p className="text-white/80 mt-3 max-w-md">A website, online ordering or a digital menu — explained in plain language, not tech jargon.</p>
            <Link to="/business" className="inline-flex items-center gap-1.5 mt-6 bg-white text-accent font-semibold px-5 py-2.5 rounded-card hover:bg-white/90">
              See business solutions <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['I need a website', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80'],
              ['I need online ordering', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&q=80'],
              ['I need a digital menu', 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=700&q=80'],
              ['I need help with Google', 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=700&q=80'],
            ].map(([title, image]) => (
              <div key={title} className="relative min-h-28 overflow-hidden rounded-card border border-white/20">
                <img src={image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-35" />
                <span className="relative block px-4 py-3.5 text-sm font-medium">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDENT OPPORTUNITIES */}
      <section className="container-page py-14">
        <div className="card overflow-hidden flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
            alt="Students collaborating on a project"
            loading="lazy"
            className="w-full lg:w-64 h-48 lg:h-44 object-cover"
          />
          <div className="p-6 sm:p-8 flex-1">
            <h2 className="font-display font-bold text-2xl text-ink">Studying, and want real project experience?</h2>
            <p className="text-ink-muted mt-2 max-w-lg">Find small, practical projects from real businesses, build a portfolio and collect reviews as you go.</p>
          </div>
          <Link to="/students" className="btn-primary shrink-0 px-5 py-3 mx-6 mb-6 lg:mx-8 lg:mb-0">Explore student opportunities <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="container-page py-6 pb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-ink">Featured services</h2>
          <Link to="/discover?tab=services" className="text-sm font-medium text-accent hover:underline hidden sm:block">See all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      </section>

      {/* RECOMMENDED PEOPLE */}
      <section className="bg-surface border-y border-line">
        <div className="container-page py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-ink">People to know</h2>
            <Link to="/discover?tab=people" className="text-sm font-medium text-accent hover:underline hidden sm:block">See all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </div>
      </section>

      {/* RECENTLY REQUESTED */}
      <section className="container-page py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-ink">Recently requested</h2>
          <Link to="/discover?tab=needs" className="text-sm font-medium text-accent hover:underline hidden sm:block">See all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : requests.map((r) => <RequestCard key={r.id} request={r} />)}
        </div>
      </section>

      {/* WHY FREELANCERHUB */}
      <section className="bg-surface border-y border-line">
        <div className="container-page py-14">
          <h2 className="font-display font-bold text-2xl text-ink mb-8">Why FreelancerHub</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle2, title: 'No tech knowledge needed', text: 'Explain what you want in plain language — we help translate it into requirements providers understand.' },
              { icon: ShieldCheck, title: 'Everyone gets a fair shot', text: 'Students, beginners, professionals and agencies are all judged on the same reviews and work samples.' },
              { icon: Clock, title: 'Clear timelines and pricing', text: 'See delivery time and price upfront in every offer — no surprises halfway through.' },
            ].map((f) => (
              <div key={f.title} className="flex flex-col gap-3">
                <f.icon size={22} className="text-accent" />
                <p className="font-display font-bold text-ink">{f.title}</p>
                <p className="text-sm text-ink-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / REVIEWS */}
      <section className="container-page py-14">
        <h2 className="font-display font-bold text-2xl text-ink mb-6">What people are saying</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6">
            <RatingStars rating={5} showNumber={false} />
            <p className="text-ink mt-3 leading-relaxed">"Priya completely understood what we needed without us having to explain everything technically. Highly recommend!"</p>
            <div className="flex items-center gap-2.5 mt-4">
              <Avatar name="Meena Krishnan" size="sm" />
              <div>
                <p className="text-sm font-semibold text-ink">Meena Krishnan</p>
                <p className="text-xs text-ink-muted">Meena Textiles</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <RatingStars rating={5} showNumber={false} />
            <p className="text-ink mt-3 leading-relaxed">"I remember how stressful deadlines were — Rahul delivered my portfolio site with days to spare before my review."</p>
            <div className="flex items-center gap-2.5 mt-4">
              <Avatar name="Ananya Iyer" size="sm" />
              <div>
                <p className="text-sm font-semibold text-ink">Ananya Iyer</p>
                <p className="text-xs text-ink-muted">Final-year student</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-page pb-20">
        <div className="card p-10 text-center bg-ink">
          <Sparkles size={22} className="text-white/70 mx-auto mb-3" />
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">Need something built? Start here.</h2>
          <p className="text-white/70 mt-2 max-w-md mx-auto">Explain it in your own words — see people who can help within minutes.</p>
          <button onClick={() => goNeedSomething()} className="mt-6 bg-white text-ink font-semibold px-6 py-3 rounded-card inline-flex items-center gap-2 hover:bg-white/90">
            I Need Something <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
