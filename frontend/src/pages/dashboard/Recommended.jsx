import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api from '../../services/api';
import RequestCard from '../../components/cards/RequestCard';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';

export default function Recommended() {
  const [requests, setRequests] = useState(null);

  useEffect(() => { api.get('/dashboard/recommended-requests').then((r) => setRequests(r.data.requests)); }, []);

  if (!requests) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink">Recommended for you</h1>
      <p className="text-sm text-ink-muted mt-1 mb-6">Matched on your category, skills, budget fit and availability — using simple, explainable rules.</p>

      {requests.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No matches right now"
          description="Add more skills and services to your profile so we can match you to more requests — or browse everything in Discover."
          action={<Link to="/discover?tab=needs" className="btn-primary">Browse all requests</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((r) => <RequestCard key={r.id} request={r} matchReasons={r.matchReasons} />)}
        </div>
      )}
    </div>
  );
}
