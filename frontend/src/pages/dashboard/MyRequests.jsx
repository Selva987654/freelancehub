import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import api from '../../services/api';
import RequestCard from '../../components/cards/RequestCard';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';

export default function MyRequests() {
  const [requests, setRequests] = useState(null);

  useEffect(() => { api.get('/requests/mine').then((r) => setRequests(r.data.requests)); }, []);

  if (!requests) return <PageLoading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-ink">My Requests</h1>
        <Link to="/need-something" className="btn-primary"><Plus size={15} /> Create Request</Link>
      </div>
      {requests.length === 0 ? (
        <EmptyState icon={FileText} title="No active requests" description="Post what you need and start getting offers from providers." action={<Link to="/need-something" className="btn-primary">Create your first request</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((r) => <RequestCard key={r.id} request={r} />)}
        </div>
      )}
    </div>
  );
}
