import { useEffect, useState } from 'react';
import api from '../../services/api';
import AdminTable from '../../components/AdminTable';
import RatingStars from '../../components/ui/RatingStars';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils/helpers';

export default function AdminReviews() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/reviews').then((r) => setRows(r.data.reviews)); }, []);
  if (!rows) return <PageLoading />;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-5">Reviews</h1>
      <AdminTable
        rows={rows}
        empty="No reviews have been left yet."
        columns={[
          { key: 'reviewer_name', label: 'From' },
          { key: 'reviewee_name', label: 'About' },
          { key: 'rating', label: 'Rating', render: (r) => <RatingStars rating={r.rating} showNumber={false} size={13} /> },
          { key: 'comment', label: 'Comment', render: (r) => <span className="text-ink-muted line-clamp-2 max-w-sm block">{r.comment || '—'}</span> },
          { key: 'created_at', label: 'Date', render: (r) => <span className="text-ink-muted whitespace-nowrap">{formatDate(r.created_at)}</span> },
        ]}
      />
    </div>
  );
}
