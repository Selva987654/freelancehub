import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminTable from '../../components/AdminTable';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, formatDate } from '../../utils/helpers';

export default function AdminServices() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/services').then((r) => setRows(r.data.services)); }, []);
  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Services</h1>
      <AdminTable
        rows={rows}
        empty="No services have been published yet."
        columns={[
          { key: 'title', label: 'Service', render: (s) => <Link to={`/services/${s.id}`} className="font-medium text-ink hover:text-accent hover:underline line-clamp-1">{s.title}</Link> },
          { key: 'provider_name', label: 'Provider', render: (s) => <Link to={`/providers/${s.provider_id}`} className="text-ink hover:text-accent hover:underline">{s.provider_name}</Link> },
          { key: 'starting_price', label: 'From', render: (s) => <span className="font-medium whitespace-nowrap">{formatINR(s.starting_price)}</span> },
          { key: 'delivery_days', label: 'Delivery', render: (s) => <span className="text-ink-muted whitespace-nowrap">{s.delivery_days} days</span> },
          { key: 'is_active', label: 'Status', render: (s) => <span className={`badge ${s.is_active ? 'bg-success-tint text-success' : 'bg-line/60 text-ink-faint'}`}>{s.is_active ? 'Active' : 'Hidden'}</span> },
          { key: 'created_at', label: 'Created', render: (s) => <span className="text-ink-muted whitespace-nowrap">{formatDate(s.created_at)}</span> },
        ]}
      />
    </div>
  );
}
