import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-page py-24 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-accent-tint text-accent flex items-center justify-center mb-5">
        <Compass size={26} />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-ink">Page not found</h1>
      <p className="text-ink-muted mt-2 max-w-sm">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
