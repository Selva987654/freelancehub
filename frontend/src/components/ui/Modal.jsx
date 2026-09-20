import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative bg-surface w-full ${maxWidth} sm:rounded-card rounded-t-2xl shadow-lift max-h-[90vh] overflow-y-auto animate-[slideup_0.18s_ease-out]`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line sticky top-0 bg-surface z-10">
          <h2 className="font-display font-bold text-lg text-ink">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-ink-muted hover:bg-black/5 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
