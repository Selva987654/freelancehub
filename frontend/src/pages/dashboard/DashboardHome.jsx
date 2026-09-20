import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Handshake, Briefcase, CheckCircle2, Plus, Search, Sparkles, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR } from '../../utils/helpers';

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/dashboard/overview').then((r) => setStats(r.data)); }, []);

  if (!stats) return <PageLoading />;

  const isClient = user.role === 'client';

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink">Welcome back, {user.name.split(' ')[0]}</h1>
      <p className="text-ink-muted mt-1">{isClient ? 'Here\u2019s what\u2019s happening with your requests.' : 'Here\u2019s what\u2019s happening with your work.'}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        {isClient ? (
          <>
            <StatCard icon={FileText} label="Active Requests" value={stats.activeRequests} />
            <StatCard icon={Handshake} label="Offers Received" value={stats.offersReceived} />
            <StatCard icon={Briefcase} label="Active Projects" value={stats.activeProjects} />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completedProjects} />
          </>
        ) : (
          <>
            <StatCard icon={Handshake} label="Offers Sent" value={stats.offersSent} />
            <StatCard icon={Briefcase} label="Active Projects" value={stats.activeProjects} />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completedProjects} />
            <StatCard icon={IndianRupee} label="Project Value" value={formatINR(stats.projectValue)} />
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-display font-bold text-lg text-ink mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          {isClient ? (
            <>
              <Link to="/need-something" className="btn-primary"><Plus size={15} /> Create Request</Link>
              <Link to="/discover?tab=people" className="btn-secondary"><Search size={15} /> Find Someone</Link>
              <Link to="/dashboard/projects" className="btn-secondary"><Briefcase size={15} /> View Active Work</Link>
            </>
          ) : (
            <>
              <Link to="/discover?tab=needs" className="btn-primary"><Search size={15} /> Find Work</Link>
              <Link to="/dashboard/services" className="btn-secondary"><Plus size={15} /> Add Service</Link>
              <Link to="/dashboard/portfolio" className="btn-secondary"><Plus size={15} /> Add Portfolio</Link>
            </>
          )}
        </div>
      </div>

      {!isClient && stats.recommendedCount > 0 && (
        <Link to="/dashboard/recommended" className="card p-5 mt-8 flex items-center gap-4 hover:shadow-lift transition-all">
          <div className="w-10 h-10 rounded-card bg-accent-tint text-accent flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm text-ink">{stats.recommendedCount} requests recommended for you</p>
            <p className="text-xs text-ink-muted mt-0.5">Based on your skills, category and budget fit.</p>
          </div>
        </Link>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5">
      <Icon size={18} className="text-accent mb-3" />
      <p className="font-display font-extrabold text-2xl text-ink">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
