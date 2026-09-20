import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const dashboardTo = user?.role === 'admin' ? '/admin' : '/dashboard';

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/need-something', label: 'Post', icon: PlusCircle },
    { to: user ? '/messages' : '/login', label: 'Messages', icon: MessageSquare },
    { to: user ? dashboardTo : '/login', label: user ? 'You' : 'Log in', icon: LayoutDashboard },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
      {items.map((it) => (
        <NavLink
          key={it.label}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-ink-muted'}`
          }
        >
          <it.icon size={20} />
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
