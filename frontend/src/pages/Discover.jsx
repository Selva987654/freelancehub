import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';
import ProviderCard from '../components/cards/ProviderCard';
import ServiceCard from '../components/cards/ServiceCard';
import RequestCard from '../components/cards/RequestCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Loading';
import { PackageSearch } from 'lucide-react';

const TABS = [
  { key: 'needs', label: 'Needs' },
  { key: 'services', label: 'Services' },
  { key: 'people', label: 'People' },
];

const SORT_OPTIONS = {
  needs: [{ v: '', l: 'Newest' }],
  services: [{ v: 'newest', l: 'Newest' }, { v: 'rating', l: 'Highest Rated' }, { v: 'price_low', l: 'Lowest Starting Price' }],
  people: [{ v: 'rating', l: 'Recommended' }, { v: 'newest', l: 'Newest' }, { v: 'price_low', l: 'Lowest Starting Price' }, { v: 'experienced', l: 'Most Experienced' }],
};

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'needs';
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState(params.get('q') || '');

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data.categories)); }, []);

  useEffect(() => {
    setLoading(true);
    const category = params.get('category') || '';
    const sort = params.get('sort') || '';
    const qParam = params.get('q') || '';

    let request;
    if (tab === 'needs') {
      request = api.get('/requests', { params: { category, budget: params.get('budget') || undefined, timeline: params.get('timeline') || undefined, q: qParam || undefined, pageSize: 24 } });
    } else if (tab === 'services') {
      request = api.get('/services', { params: { category, sort: sort || undefined, maxPrice: params.get('maxPrice') || undefined, q: qParam || undefined, pageSize: 24 } });
    } else {
      request = api.get('/providers', {
        params: {
          category, sort: sort || 'rating', providerType: params.get('providerType') || undefined,
          availability: params.get('availability') || undefined, remote: params.get('remote') || undefined,
          minRating: params.get('minRating') || undefined, location: params.get('location') || undefined, q: qParam || undefined, pageSize: 24,
        },
      });
    }

    request.then((r) => {
      const key = tab === 'needs' ? 'requests' : tab === 'services' ? 'services' : 'providers';
      setItems(r.data[key]);
      setTotal(r.data.total);
    }).finally(() => setLoading(false));
  }, [tab, params]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  function switchTab(key) {
    setParams({ tab: key, q: q || '' }, { replace: true });
  }

  function handleSearch(e) {
    e.preventDefault();
    setParam('q', q);
  }

  function clearFilters() {
    setParams({ tab, q: params.get('q') || '' });
  }

  const activeFilterCount = Array.from(params.keys()).filter((k) => !['tab', 'q', 'sort'].includes(k)).length;

  return (
    <div className="container-page py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display font-extrabold text-3xl text-ink">Discover</h1>
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} className="input pl-9" />
        </form>
      </div>

      <div className="flex items-center gap-1 border-b border-line mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5 gap-3">
        <button onClick={() => setFiltersOpen((o) => !o)} className="btn-secondary text-sm py-2">
          <SlidersHorizontal size={14} /> Filters {activeFilterCount > 0 && <span className="ml-0.5 badge bg-accent text-white px-1.5">{activeFilterCount}</span>}
        </button>
        {SORT_OPTIONS[tab].length > 1 && (
          <select value={params.get('sort') || ''} onChange={(e) => setParam('sort', e.target.value)} className="input w-auto text-sm py-2">
            {SORT_OPTIONS[tab].map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        )}
      </div>

      {filtersOpen && (
        <div className="card p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-[fadein_0.12s_ease-out]">
          <div>
            <label className="label">Category</label>
            <select value={params.get('category') || ''} onChange={(e) => setParam('category', e.target.value)} className="input text-sm">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          {tab === 'needs' && (
            <>
              <div>
                <label className="label">Budget</label>
                <select value={params.get('budget') || ''} onChange={(e) => setParam('budget', e.target.value)} className="input text-sm">
                  <option value="">Any budget</option>
                  {['Under ₹5,000', '₹5,000–₹10,000', '₹10,000–₹25,000', '₹25,000–₹50,000', '₹50,000+', 'Not sure'].map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Timeline</label>
                <select value={params.get('timeline') || ''} onChange={(e) => setParam('timeline', e.target.value)} className="input text-sm">
                  <option value="">Any timeline</option>
                  {['Urgent', 'This week', '2–4 weeks', '1–2 months', 'Flexible'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}

          {tab === 'services' && (
            <div>
              <label className="label">Max price</label>
              <input type="number" placeholder="e.g. 10000" value={params.get('maxPrice') || ''} onChange={(e) => setParam('maxPrice', e.target.value)} className="input text-sm" />
            </div>
          )}

          {tab === 'people' && (
            <>
              <div>
                <label className="label">Experience level</label>
                <select value={params.get('providerType') || ''} onChange={(e) => setParam('providerType', e.target.value)} className="input text-sm">
                  <option value="">Any level</option>
                  {['Student', 'Beginner', 'Professional', 'Agency'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Minimum rating</label>
                <select value={params.get('minRating') || ''} onChange={(e) => setParam('minRating', e.target.value)} className="input text-sm">
                  <option value="">Any rating</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4.0+</option>
                </select>
              </div>
              <div>
                <label className="label">Availability</label>
                <select value={params.get('availability') || ''} onChange={(e) => setParam('availability', e.target.value)} className="input text-sm">
                  <option value="">Any</option>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={params.get('remote') === 'true'} onChange={(e) => setParam('remote', e.target.checked ? 'true' : '')} className="rounded border-line-strong" />
                  Remote only
                </label>
              </div>
            </>
          )}

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-accent font-medium flex items-center gap-1 self-end"><X size={13} /> Clear filters</button>
          )}
        </div>
      )}

      <p className="text-sm text-ink-muted mb-4">{loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'}`}</p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={`No ${tab} match your filters yet`}
          description="Try widening your filters, or check back soon — new listings are added often."
          action={activeFilterCount > 0 && <button onClick={clearFilters} className="btn-secondary">Clear filters</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            tab === 'needs' ? <RequestCard key={item.id} request={item} /> :
            tab === 'services' ? <ServiceCard key={item.id} service={item} /> :
            <ProviderCard key={item.id} provider={item} />
          ))}
        </div>
      )}
    </div>
  );
}
