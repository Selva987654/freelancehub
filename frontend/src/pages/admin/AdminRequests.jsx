import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminTable from '../../components/AdminTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils/helpers';

export default function AdminRequests() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/requests').then((r) => setRows(r.data.requests)); }, []);
  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Requests</h1>
      <AdminTable
        rows={rows}
        empty="No requests have been posted yet."
        columns={[
          { key: 'title', label: 'Request', render: (r) => <Link to={`/requests/${r.id}`} className="font-medium text-ink hover:text-accent hover:underline line-clamp-1">{r.title}</Link> },
          { key: 'client_name', label: 'Client' },
          { key: 'category_name', label: 'Category', render: (r) => <span className="text-ink-muted">{r.category_name || '—'}</span> },
          { key: 'budget_range', label: 'Budget', render: (r) => <span className="text-ink-muted whitespace-nowrap">{r.budget_range}</span> },
          { key: 'offer_count', label: 'Offers' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'created_at', label: 'Posted', render: (r) => <span className="text-ink-muted whitespace-nowrap">{formatDate(r.created_at)}</span> },
        ]}
      />
    </div>
  );
}
