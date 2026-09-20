import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminTable from '../../components/AdminTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, formatDate } from '../../utils/helpers';

export default function AdminProjects() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/projects').then((r) => setRows(r.data.projects)); }, []);
  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Projects</h1>
      <AdminTable
        rows={rows}
        empty="No projects have been started yet."
        columns={[
          { key: 'title', label: 'Project', render: (p) => <Link to={`/projects/${p.id}`} className="font-medium text-ink hover:text-accent hover:underline line-clamp-1">{p.title}</Link> },
          { key: 'client_name', label: 'Client' },
          { key: 'provider_name', label: 'Provider' },
          { key: 'price', label: 'Value', render: (p) => <span className="font-medium whitespace-nowrap">{formatINR(p.price)}</span> },
          { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          { key: 'created_at', label: 'Started', render: (p) => <span className="text-ink-muted whitespace-nowrap">{formatDate(p.created_at)}</span> },
        ]}
      />
    </div>
  );
}
