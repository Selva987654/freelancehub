import { NavLink, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import {
  LayoutGrid, Users, FileText, Handshake, Briefcase, Package, Star, Tags, Flag,
} from 'lucide-react';

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutGrid },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/requests', label: 'Requests', icon: FileText },
  { to: '/admin/offers', label: 'Offers', icon: Handshake },
  { to: '/admin/projects', label: 'Projects', icon: Briefcase },
  { to: '/admin/services', label: 'Services', icon: Package },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container-page py-6 lg:py-8 flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-faint mb-2">Admin</p>
          <nav className="sticky top-24 space-y-0.5">
            {ADMIN_NAV.map((item) => (
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
        <div className="flex-1 min-w-0">
          <div className="lg:hidden -mx-4 sm:-mx-6 mb-5 px-4 sm:px-6 flex gap-1.5 overflow-x-auto pb-2 border-b border-line">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-medium whitespace-nowrap ${isActive ? 'bg-accent text-white' : 'bg-black/[0.03] text-ink-muted'}`
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
    </div>
  );
}
