import { NavLink, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid, FileText, Handshake, Briefcase, Bookmark, MessageSquare, Bell, User,
  Sparkles, Package, GalleryHorizontalEnd,
} from 'lucide-react';

const CLIENT_NAV = [
  { to: '/dashboard', end: true, label: 'Overview', icon: LayoutGrid },
  { to: '/dashboard/requests', label: 'My Requests', icon: FileText },
  { to: '/dashboard/offers', label: 'Offers', icon: Handshake },
  { to: '/dashboard/projects', label: 'Work', icon: Briefcase },
  { to: '/dashboard/saved', label: 'Saved', icon: Bookmark },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const PROVIDER_NAV = [
  { to: '/dashboard', end: true, label: 'Overview', icon: LayoutGrid },
  { to: '/dashboard/recommended', label: 'Recommended', icon: Sparkles },
  { to: '/dashboard/my-offers', label: 'My Offers', icon: Handshake },
  { to: '/dashboard/projects', label: 'Work', icon: Briefcase },
  { to: '/dashboard/services', label: 'Services', icon: Package },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: GalleryHorizontalEnd },
  { to: '/dashboard/saved', label: 'Saved', icon: Bookmark },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout() {
  const { user } = useAuth();
  const nav = user?.role === 'provider' ? PROVIDER_NAV : CLIENT_NAV;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container-page py-6 lg:py-10 flex gap-8 xl:gap-10">
        <aside className="hidden lg:block w-60 shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${isActive ? 'bg-accent-tint text-accent' : 'text-ink-muted hover:text-ink hover:bg-black/[0.03]'}`
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 pb-16 lg:pb-0">
          <div className="lg:hidden -mx-4 sm:-mx-6 mb-6 px-4 sm:px-6 flex gap-1.5 overflow-x-auto pb-3 border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-accent text-white' : 'bg-black/[0.03] text-ink-muted'}`
                }
              >
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
