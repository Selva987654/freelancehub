import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-accent ${className}`} />;
}

export function PageLoading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-ink-muted">
      <Spinner size={26} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-line rounded w-2/3 mb-3" />
      <div className="h-3 bg-line rounded w-full mb-2" />
      <div className="h-3 bg-line rounded w-5/6" />
    </div>
  );
}
