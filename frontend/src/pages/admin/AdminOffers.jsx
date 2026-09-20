import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminTable from '../../components/AdminTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, formatDate } from '../../utils/helpers';

export default function AdminOffers() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/offers').then((r) => setRows(r.data.offers)); }, []);
  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Offers</h1>
      <AdminTable
        rows={rows}
        empty="No offers have been sent yet."
        columns={[
          { key: 'request_title', label: 'Request', render: (o) => <Link to={`/requests/${o.request_id}`} className="font-medium text-ink hover:text-accent hover:underline line-clamp-1">{o.request_title}</Link> },
          { key: 'provider_name', label: 'Provider', render: (o) => <Link to={`/providers/${o.provider_id}`} className="text-ink hover:text-accent hover:underline">{o.provider_name}</Link> },
          { key: 'price', label: 'Price', render: (o) => <span className="font-medium whitespace-nowrap">{formatINR(o.price)}</span> },
          { key: 'delivery_days', label: 'Delivery', render: (o) => <span className="text-ink-muted whitespace-nowrap">{o.delivery_days} days</span> },
          { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
          { key: 'created_at', label: 'Sent', render: (o) => <span className="text-ink-muted whitespace-nowrap">{formatDate(o.created_at)}</span> },
        ]}
      />
    </div>
  );
}
