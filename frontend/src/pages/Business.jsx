import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, ShoppingBag, UtensilsCrossed, Package, MapPin, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EXAMPLES = [
  { icon: Globe, title: 'I need a website', text: 'A simple site with what you offer, where you are, and how customers reach you.', prefill: 'I need a website for my business showing what we offer, our location and contact details.' },
  { icon: ShoppingBag, title: 'I need online ordering', text: 'Let customers order without calling — through your site or a WhatsApp link.', prefill: 'I want customers to be able to order online instead of calling me every time.' },
  { icon: UtensilsCrossed, title: 'I need a digital menu', text: 'A menu customers can open on their phone, easy to update when prices change.', prefill: 'I need a digital menu customers can view on their phone before or during their visit.' },
  { icon: Package, title: 'I need a product catalogue', text: 'A shareable list of everything you sell, with photos and prices.', prefill: 'I need a product catalogue with photos and prices that I can share as a link.' },
  { icon: MapPin, title: 'I need help with my Google presence', text: 'Show up properly when nearby customers search for what you do.', prefill: 'I need help getting my business to show up on Google when customers search nearby.' },
  { icon: Wrench, title: 'I need someone to maintain my website', text: 'Small updates, fixes and new content, handled as and when you need it.', prefill: 'I need someone to maintain and occasionally update my existing website.' },
];

export default function Business() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function start(prefill) {
    if (!user) return navigate('/register?role=client&next=/need-something');
    if (user.role !== 'client') return navigate('/discover?tab=needs');
    navigate('/need-something', { state: { prefill } });
  }

  return (
    <div>
      <section className="container-page pt-14 pb-10">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-ink leading-[1.1] max-w-2xl">
          Need to get your business online?
        </h1>
        <p className="text-lg text-ink-muted mt-4 max-w-xl">
          You don't need to know what a website costs, how it gets built, or what any of the technical words mean. Tell us the problem — we'll connect you with someone who can solve it.
        </p>
        <button onClick={() => start()} className="btn-primary text-base px-5 py-3 mt-7">
          Tell us what you need <ArrowRight size={16} />
        </button>
      </section>

      <section className="container-page pb-16">
        <h2 className="font-display font-bold text-xl text-ink mb-5">Common things businesses ask for</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXAMPLES.map((e) => (
            <button
              key={e.title}
              onClick={() => start(e.prefill)}
              className="card p-5 text-left hover:shadow-lift hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-card bg-accent-tint text-accent flex items-center justify-center mb-3">
                <e.icon size={19} />
              </div>
              <p className="font-display font-bold text-ink">{e.title}</p>
              <p className="text-sm text-ink-muted mt-1.5">{e.text}</p>
              <span className="text-sm text-accent font-medium mt-3 inline-flex items-center gap-1">Start here <ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-surface border-y border-line">
        <div className="container-page py-14 grid sm:grid-cols-3 gap-8">
          {[
            { n: '1', t: 'Explain it in your own words', d: 'No forms full of technical jargon. Just describe your situation.' },
            { n: '2', t: 'Compare before you choose', d: 'See prices, delivery times and past work side by side.' },
            { n: '3', t: 'Work together until it\u2019s done', d: 'Track progress, message, and approve the final result.' },
          ].map((s) => (
            <div key={s.n}>
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-display font-bold text-sm mb-3">{s.n}</span>
              <p className="font-display font-bold text-ink">{s.t}</p>
              <p className="text-sm text-ink-muted mt-1.5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-14">
        <div className="card p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink">Still not sure what would help?</h2>
            <p className="text-sm text-ink-muted mt-1.5">Describe your situation and we'll suggest what might work.</p>
          </div>
          <button onClick={() => navigate('/not-sure')} className="btn-secondary shrink-0">Get suggestions</button>
        </div>
      </section>
    </div>
  );
}
