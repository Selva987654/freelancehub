export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center mb-4">
          <Icon size={22} className="text-accent" />
        </div>
      )}
      <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
      {description && <p className="text-sm text-ink-muted mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
