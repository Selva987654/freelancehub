import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoading } from '../../components/ui/Loading';
import { formatINR, timeAgo } from '../../utils/helpers';

export default function MyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState(null);
  const [filter, setFilter] = useState('active');

  useEffect(() => { api.get('/projects/mine').then((r) => setProjects(r.data.projects)); }, []);

  if (!projects) return <PageLoading />;

  const active = projects.filter((p) => p.status !== 'completed');
  const completed = projects.filter((p) => p.status === 'completed');
  const shown = filter === 'active' ? active : completed;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Work</h1>

      <div className="flex items-center gap-1 border-b border-line mb-6">
        {[{ k: 'active', l: `Active Work (${active.length})` }, { k: 'completed', l: `Completed (${completed.length})` }].map((t) => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${filter === t.k ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={filter === 'active' ? 'No active work right now' : 'No completed work yet'}
          description={user.role === 'client' ? 'Accept an offer on one of your requests to start a project.' : 'Send offers on requests to start winning work.'}
          action={<Link to={user.role === 'client' ? '/dashboard/offers' : '/discover?tab=needs'} className="btn-primary">{user.role === 'client' ? 'View offers' : 'Find work'}</Link>}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((p) => {
            const otherName = user.role === 'client' ? p.provider_name : p.client_name;
            const otherAvatar = user.role === 'client' ? p.provider_avatar : p.client_avatar;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-5 flex items-center gap-4 hover:shadow-lift transition-all">
                <Avatar seed={otherAvatar || otherName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">with {otherName} · updated {timeAgo(p.updated_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-ink">{formatINR(p.price)}</p>
                  <StatusBadge status={p.status} className="mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
