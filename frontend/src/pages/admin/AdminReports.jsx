import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdminTable from '../../components/AdminTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils/helpers';

export default function AdminReports() {
  const [rows, setRows] = useState(null);
  const toast = useToast();

  async function load() {
    const res = await api.get('/admin/reports');
    setRows(res.data.reports);
  }

  useEffect(() => { load(); }, []);

  async function update(id, status) {
    try { await api.put(`/admin/reports/${id}`, { status }); toast.success('Report updated.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-1">Reports</h1>
      <p className="text-sm text-ink-muted mb-5">User-submitted reports about content or behaviour on the platform.</p>
      <AdminTable
        rows={rows}
        empty="No reports have been submitted — nothing needs your attention."
        columns={[
          { key: 'reporter_name', label: 'Reported by', render: (r) => r.reporter_name || 'Anonymous' },
          { key: 'target_type', label: 'Type', render: (r) => <span className="capitalize text-ink-muted">{r.target_type}</span> },
          { key: 'reason', label: 'Reason', render: (r) => <span className="text-ink-muted line-clamp-2 max-w-sm block">{r.reason}</span> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'open' ? 'open' : r.status === 'reviewed' ? 'completed' : 'closed'} /> },
          { key: 'created_at', label: 'Date', render: (r) => <span className="text-ink-muted whitespace-nowrap">{formatDate(r.created_at)}</span> },
          {
            key: 'actions', label: 'Actions', render: (r) => r.status === 'open' ? (
              <div className="flex gap-2">
                <button onClick={() => update(r.id, 'reviewed')} className="text-xs text-accent font-medium hover:underline">Mark reviewed</button>
                <button onClick={() => update(r.id, 'dismissed')} className="text-xs text-ink-muted font-medium hover:underline">Dismiss</button>
              </div>
            ) : <span className="text-xs text-ink-faint">Handled</span>,
          },
        ]}
      />
    </div>
  );
}
