'use client';

type Props = {
  data: any;
  loading?: boolean;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>★</span>
      ))}
    </span>
  );
}

export default function PortalReviewsSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', height: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
    );
  }

  if (!data || !data.items?.length) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No reviews available yet.</p>
      </div>
    );
  }

  const reviews = data.items || [];
  const summary = data.summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Reviews', value: summary.totalReviews?.toLocaleString() ?? reviews.length },
          { label: 'Average Rating', value: summary.averageRating != null ? summary.averageRating.toFixed(1) + ' ★' : '—' },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Recent reviews */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Recent Reviews</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.slice(0, 8).map((r: any) => (
            <div key={r.id || r.review_id} style={{ borderBottom: '1px solid #f8fafc', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{r.author_name}</p>
                  <StarRating rating={r.rating} />
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>
                  {r.review_date ? new Date(r.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
              {r.text && (
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginTop: '6px' }}>
                  {r.text.length > 200 ? r.text.slice(0, 200) + '…' : r.text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
