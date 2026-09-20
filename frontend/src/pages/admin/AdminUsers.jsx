import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import AdminTable from '../../components/AdminTable';
import Avatar from '../../components/ui/Avatar';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils/helpers';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const toast = useToast();

  async function load() {
    const res = await api.get('/admin/users', { params: { role: role || undefined, q: q || undefined, pageSize: 100 } });
    setUsers(res.data.users);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

  async function toggleActive(user) {
    try {
      await api.put(`/admin/users/${user.id}/active`, { isActive: !user.is_active });
      toast.success(user.is_active ? 'User deactivated.' : 'User reactivated.');
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function verify(user) {
    try {
      await api.put(`/admin/providers/${user.id}/verify`, { verified: true });
      toast.success('Provider verified.');
      load();
    } catch (err) { toast.error(err.message); }
  }

  if (!users) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="input pl-9" />
        </form>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input w-auto">
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="provider">Providers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <AdminTable
        rows={users}
        columns={[
          {
            key: 'name', label: 'User', render: (u) => (
              <div className="flex items-center gap-2.5">
                <Avatar seed={u.avatar_url || u.name} size="sm" />
                <div>
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-ink-faint">{u.email}</p>
                </div>
              </div>
            ),
          },
          { key: 'role', label: 'Role', render: (u) => <span className="badge bg-line/60 text-ink-muted capitalize">{u.role}</span> },
          { key: 'created_at', label: 'Joined', render: (u) => <span className="text-ink-muted">{formatDate(u.created_at)}</span> },
          { key: 'is_active', label: 'Status', render: (u) => <span className={`badge ${u.is_active ? 'bg-success-tint text-success' : 'bg-danger-tint text-danger'}`}>{u.is_active ? 'Active' : 'Deactivated'}</span> },
          {
            key: 'actions', label: 'Actions', render: (u) => (
              <div className="flex gap-2">
                {u.role === 'provider' && <Link to={`/providers/${u.id}`} className="text-xs text-accent font-medium hover:underline">View</Link>}
                {u.role === 'provider' && <button onClick={() => verify(u)} className="text-xs text-accent font-medium hover:underline">Verify</button>}
                {u.role !== 'admin' && (
                  <button onClick={() => toggleActive(u)} className={`text-xs font-medium hover:underline ${u.is_active ? 'text-danger' : 'text-success'}`}>
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
