import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, ChevronDown, Menu, X, LayoutDashboard, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import Avatar from './ui/Avatar';
import { timeAgo } from '../utils/helpers';

const NAV_LINKS = [
  { to: '/discover', label: 'Discover' },
  { to: '/business', label: 'For Business' },
  { to: '/students', label: 'For Students' },
  { to: '/not-sure', label: 'Not sure what you need?' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const accountRef = useRef(null);
  const notifRef = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    function onClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
  }

  function dashboardHome() {
    if (user?.role === 'admin') return '/admin';
    return '/dashboard';
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-line">
      <div className="container-page h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
          <span className="w-8 h-8 rounded-card bg-accent text-white flex items-center justify-center font-display font-extrabold text-sm">F</span>
          <span className="font-display font-extrabold text-lg tracking-tight text-ink hidden sm:inline">FreelancerHub</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-card text-sm font-medium transition-colors ${isActive ? 'text-accent bg-accent-tint' : 'text-ink-muted hover:text-ink hover:bg-black/[0.03]'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden md:flex items-center relative flex-1 max-w-xs ml-auto">
          <Search size={16} className="absolute left-3 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, people…"
            className="input pl-9 py-2 text-sm"
            aria-label="Search"
          />
        </form>

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2 rounded-full text-ink-muted hover:bg-black/[0.04] hover:text-ink"
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 card shadow-lift overflow-hidden animate-[fadein_0.12s_ease-out]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                      <span className="font-display font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-accent font-medium hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="text-sm text-ink-muted px-4 py-6 text-center">Nothing yet — you'll see offers, messages and updates here.</p>
                      )}
                      {notifications.slice(0, 8).map((n) => (
                        <Link
                          key={n.id}
                          to={n.link || '#'}
                          onClick={() => { markRead(n.id); setNotifOpen(false); }}
                          className={`block px-4 py-3 border-b border-line last:border-0 hover:bg-black/[0.02] ${!n.is_read ? 'bg-accent-tint/40' : ''}`}
                        >
                          <p className="text-sm text-ink font-medium">{n.title}</p>
                          <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[11px] text-ink-faint mt-1">{timeAgo(n.created_at)}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/messages" className="p-2 rounded-full text-ink-muted hover:bg-black/[0.04] hover:text-ink" aria-label="Messages">
                <MessageSquare size={19} />
              </Link>

              <div className="relative" ref={accountRef}>
                <button onClick={() => setAccountOpen((o) => !o)} className="flex items-center gap-1.5 p-1 rounded-full hover:bg-black/[0.04]" aria-label="Account menu">
                  <Avatar seed={user.avatar_url || user.name} size="sm" />
                  <ChevronDown size={14} className="text-ink-muted hidden sm:block" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 card shadow-lift py-1.5 animate-[fadein_0.12s_ease-out]">
                    <div className="px-3.5 py-2 border-b border-line mb-1">
                      <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                      <p className="text-xs text-ink-muted capitalize">{user.role}</p>
                    </div>
                    <Link to={dashboardHome()} onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-black/[0.03]">
                      {user.role === 'admin' ? <ShieldCheck size={16} /> : <LayoutDashboard size={16} />} Dashboard
                    </Link>
                    {user.role !== 'admin' && (
                      <Link to="/dashboard/profile" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-black/[0.03]">
                        <User size={16} /> Edit profile
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setAccountOpen(false); navigate('/'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-black/[0.03]"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </div>
          )}

          <button className="lg:hidden p-2 text-ink-muted" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-line bg-surface px-4 py-3 space-y-1 animate-[fadein_0.12s_ease-out]">
          <form onSubmit={handleSearch} className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="input pl-9 py-2 text-sm" />
          </form>
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-card text-sm font-medium text-ink hover:bg-black/[0.03]">
              {l.label}
            </NavLink>
          ))}
          {!user && (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1">Log in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1">Get started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
