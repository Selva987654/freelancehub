import { useEffect, useState } from 'react';
import { Users, UserCheck, FileText, Handshake, Briefcase, Package, Star, Flag, IndianRupee, CircleDot } from 'lucide-react';
import api from '../../services/api';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR } from '../../utils/helpers';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/admin/overview').then((r) => setStats(r.data)); }, []);

  if (!stats) return <PageLoading />;

  const cards = [
    { icon: Users, label: 'Total users', value: stats.users },
    { icon: UserCheck, label: 'Providers', value: stats.providers },
    { icon: Users, label: 'Clients', value: stats.clients },
    { icon: FileText, label: 'Requests', value: stats.requests },
    { icon: CircleDot, label: 'Open requests', value: stats.openRequests },
    { icon: Handshake, label: 'Offers', value: stats.offers },
    { icon: Briefcase, label: 'Projects', value: stats.projects },
    { icon: CircleDot, label: 'Active projects', value: stats.activeProjects },
    { icon: Briefcase, label: 'Completed projects', value: stats.completedProjects },
    { icon: Package, label: 'Services', value: stats.services },
    { icon: Star, label: 'Reviews', value: stats.reviews },
    { icon: Flag, label: 'Open reports', value: stats.reports },
  ];

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink">Platform overview</h1>
      <p className="text-sm text-ink-muted mt-1 mb-7">All figures are read live from the database.</p>

      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-card bg-accent-tint text-accent flex items-center justify-center shrink-0">
          <IndianRupee size={20} />
        </div>
        <div>
          <p className="text-xs text-ink-muted">Total project value on the platform</p>
          <p className="font-display font-extrabold text-2xl text-ink mt-0.5">{formatINR(stats.totalProjectValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <c.icon size={17} className="text-accent mb-3" />
            <p className="font-display font-extrabold text-xl text-ink">{c.value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
