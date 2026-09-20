import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface mt-20 pb-16 lg:pb-0">
      <div className="container-page py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-card bg-accent text-white flex items-center justify-center font-display font-extrabold text-xs">F</span>
            <span className="font-display font-extrabold text-ink">FreelancerHub</span>
          </Link>
          <p className="text-sm text-ink-muted max-w-[220px]">Tell us what you need. Find someone who can make it happen.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">For people who need help</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link to="/need-something" className="hover:text-ink">Post a request</Link></li>
            <li><Link to="/business" className="hover:text-ink">Business solutions</Link></li>
            <li><Link to="/not-sure" className="hover:text-ink">Not sure what you need?</Link></li>
            <li><Link to="/discover?tab=people" className="hover:text-ink">Browse people</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">For people who help</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link to="/discover?tab=needs" className="hover:text-ink">Find work</Link></li>
            <li><Link to="/students" className="hover:text-ink">Student opportunities</Link></li>
            <li><Link to="/register" className="hover:text-ink">Become a provider</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Company</p>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link to="/discover" className="hover:text-ink">Discover</Link></li>
            <li><Link to="/login" className="hover:text-ink">Log in</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-page pt-6 border-t border-line text-xs text-ink-faint">
        © {new Date().getFullYear()} FreelancerHub. A demo product built for illustration purposes.
      </div>
    </footer>
  );
}
