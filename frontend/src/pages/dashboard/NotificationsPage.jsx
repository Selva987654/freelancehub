import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import EmptyState from '../../components/ui/EmptyState';
import { timeAgo } from '../../utils/helpers';

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-ink">Notifications</h1>
        {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary text-sm py-2">Mark all read</button>}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing here yet" description="Offers, messages, deliveries and reviews will show up here as they happen." />
      ) : (
        <div className="card divide-y divide-line">
          {notifications.map((n) => (
            <Link
              key={n.id}
              to={n.link || '#'}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`block p-4 hover:bg-black/[0.02] ${!n.is_read ? 'bg-accent-tint/40' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                <div className={n.is_read ? 'ml-5' : ''}>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-sm text-ink-muted mt-0.5">{n.body}</p>
                  <p className="text-xs text-ink-faint mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
