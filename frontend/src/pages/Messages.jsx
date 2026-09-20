import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import ChatThread from '../components/ChatThread';
import EmptyState from '../components/ui/EmptyState';
import { PageLoading } from '../components/ui/Loading';
import { timeAgo, classNames } from '../utils/helpers';

export default function Messages() {
  const { id: activeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  // Refresh list (unread counts, ordering) whenever the active thread changes
  useEffect(() => { if (activeId) load(); /* eslint-disable-next-line */ }, [activeId]);

  const active = conversations.find((c) => c.id === activeId);

  if (loading) return <PageLoading />;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Messages</h1>
          <p className="text-sm text-ink-muted mt-1">Keep conversations and project updates in one place.</p>
        </div>
      </div>
      <div className="card overflow-hidden flex h-[min(680px,calc(100vh-190px))] min-h-[460px]">
        {/* Conversation list */}
        <div className={classNames('w-full lg:w-80 shrink-0 border-r border-line overflow-y-auto', activeId && 'hidden lg:block')}>
          {conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" description="Messages with clients and providers will show up here." />
          ) : (
            conversations.map((c) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={classNames(
                  'flex items-center gap-3 px-4 py-3.5 border-b border-line last:border-0 hover:bg-black/[0.02]',
                  c.id === activeId && 'bg-accent-tint/50'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar seed={c.other_avatar || c.other_name} size="md" />
                  {c.unread_count > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-danger border-2 border-surface" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={classNames('text-sm truncate', c.unread_count > 0 ? 'font-bold text-ink' : 'font-medium text-ink')}>{c.other_name}</p>
                    <span className="text-[11px] text-ink-faint shrink-0">{timeAgo(c.last_message_at)}</span>
                  </div>
                  {c.project_title && <p className="text-[11px] text-accent truncate">{c.project_title}</p>}
                  <p className="text-xs text-ink-muted truncate">{c.last_message || 'Say hello!'}</p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Thread */}
        <div className={classNames('flex-1 min-w-0 flex flex-col', !activeId && 'hidden lg:flex')}>
          {active ? (
            <>
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-line">
                <button onClick={() => navigate('/messages')} className="lg:hidden text-ink-muted"><ArrowLeft size={18} /></button>
                <Avatar seed={active.other_avatar || active.other_name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink">{active.other_name}</p>
                  {active.project_title && <p className="text-xs text-ink-faint">{active.project_title}</p>}
                </div>
              </div>
              <div className="flex-1 px-4 sm:px-5">
                <ChatThread conversationId={activeId} otherName={active.other_name} otherAvatar={active.other_avatar} compact={false} />
              </div>
            </>
          ) : (
            <div className="flex-1 hidden lg:flex items-center justify-center text-ink-faint text-sm">Select a conversation to start messaging.</div>
          )}
        </div>
      </div>
    </div>
  );
}
