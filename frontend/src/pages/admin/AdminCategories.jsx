import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminTable from '../../components/AdminTable';
import CategoryIcon from '../../components/ui/CategoryIcon';
import { PageLoading } from '../../components/ui/Loading';

export default function AdminCategories() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/categories').then((r) => setRows(r.data.categories)); }, []);
  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-1">Categories</h1>
      <p className="text-sm text-ink-muted mb-5">Usage counts are calculated live from requests and services.</p>
      <AdminTable
        rows={rows}
        columns={[
          {
            key: 'name', label: 'Category', render: (c) => (
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0"><CategoryIcon name={c.icon} size={14} /></span>
                <span className="font-medium text-ink">{c.name}</span>
              </div>
            ),
          },
          { key: 'description', label: 'Description', render: (c) => <span className="text-ink-muted line-clamp-1 max-w-sm block">{c.description}</span> },
          { key: 'request_count', label: 'Requests' },
          { key: 'service_count', label: 'Services' },
          { key: 'actions', label: '', render: (c) => <Link to={`/discover?tab=needs&category=${c.slug}`} className="text-xs text-accent font-medium hover:underline whitespace-nowrap">View</Link> },
        ]}
      />
    </div>
  );
}
