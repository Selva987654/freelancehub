const STYLES = {
  open: 'bg-accent-tint text-accent',
  in_progress: 'bg-warning-tint text-warning',
  working: 'bg-warning-tint text-warning',
  review: 'bg-warning-tint text-warning',
  planning: 'bg-accent-tint text-accent',
  completed: 'bg-success-tint text-success',
  approved: 'bg-success-tint text-success',
  accepted: 'bg-success-tint text-success',
  submitted: 'bg-warning-tint text-warning',
  pending: 'bg-line/60 text-ink-muted',
  declined: 'bg-danger-tint text-danger',
  withdrawn: 'bg-line/60 text-ink-faint',
  closed: 'bg-line/60 text-ink-faint',
  changes_requested: 'bg-danger-tint text-danger',
};

const LABELS = {
  open: 'Open', in_progress: 'In progress', working: 'Working', review: 'In review',
  planning: 'Planning', completed: 'Completed', approved: 'Approved', accepted: 'Accepted',
  submitted: 'Submitted', pending: 'Pending', declined: 'Declined', withdrawn: 'Withdrawn',
  closed: 'Closed', changes_requested: 'Changes requested',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`badge ${STYLES[status] || 'bg-line/60 text-ink-muted'} ${className}`}>
      {LABELS[status] || status}
    </span>
  );
}
