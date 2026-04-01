'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonCard from './SkeletonCard';

type Props = { slug: string; hasGHL: boolean };

type Review = {
  id: number; author_name: string; rating: number; text: string | null;
  review_date: string; reply_text: string | null;
};
type ReviewsData = {
  reviews: Review[];
  monthly: { month: string; count: number }[];
  summary: { totalReviews: number; averageRating: number; fiveStarCount: number; responseRate: number; reviewsThisMonth: number };
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const full = Math.floor(rating);
  const cls = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <span className={cls}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? 'text-yellow-400' : 'text-slate-600'}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsSection({ slug, hasGHL }: Props) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch(`/api/reviews/${slug}`);
      setData(await res.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!hasGHL) return (
    <div className="bp-card text-center">
      <p className="text-slate-400 text-sm">No review data yet. Connect via GHL integration.</p>
    </div>
  );

  if (loading) return <div className="space-y-6"><SkeletonCard height="h-24" /><SkeletonCard height="h-48" /></div>;
  if (error) return <div className="bp-card text-slate-400 text-center">Failed to load — try refreshing</div>;

  const s = data?.summary;
  const noData = !data || data.reviews.length === 0;

  if (noData) return (
    <div className="bp-card text-center">
      <p className="text-slate-400 text-sm">No review data yet. Connect via GHL integration.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Average Rating</p>
          <p className="text-xl font-bold text-white mb-1">{(s?.averageRating || 0).toFixed(1)}</p>
          <StarRating rating={s?.averageRating || 0} />
        </div>
        {[
          { label: 'Total Reviews', value: (s?.totalReviews || 0).toLocaleString() },
          { label: 'Reviews This Month', value: (s?.reviewsThisMonth || 0).toLocaleString() },
          { label: 'Response Rate', value: `${(s?.responseRate || 0).toFixed(1)}%` },
        ].map((card, i) => (
          <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="bp-card">
        <h3 className="text-white font-semibold mb-4">Reviews Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data?.monthly || []}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid' }} />
            <Bar dataKey="count" fill="#f97316" radius={[3, 3, 0, 0]} name="Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reviews table */}
      <div className="bp-card">
        <h3 className="text-white font-semibold mb-4">Recent Reviews</h3>
        <div className="space-y-0">
          <div className="grid grid-cols-12 text-slate-500 text-axis-label font-medium uppercase pb-3 border-b border-border-light">
            <div className="col-span-4">Reviewer</div>
            <div className="col-span-3">Rating</div>
            <div className="col-span-3 text-right">Date</div>
            <div className="col-span-2 text-center">Replied</div>
          </div>
          {(data?.reviews || []).slice(0, 20).map((review, i) => (
            <div key={review.id}>
              <div
                className={`grid grid-cols-12 items-center py-3 cursor-pointer hover:bg-white/[0.03] transition-colors px-2 rounded border-b border-border-light last:border-0`}
                onClick={() => review.text && toggleExpand(review.id)}
              >
                <div className="col-span-4 text-white text-sm truncate">{review.author_name}</div>
                <div className="col-span-3"><StarRating rating={review.rating} /></div>
                <div className="col-span-3 text-right text-slate-400 text-xs">
                  {new Date(review.review_date).toLocaleDateString()}
                </div>
                <div className="col-span-2 text-center text-sm">
                  {review.reply_text ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-slate-600">✗</span>
                  )}
                </div>
              </div>
              {expanded.has(review.id) && (
                <div className="bg-background border-l-2 border-accent px-4 py-3 mb-1 rounded-b">
                  {review.text && (
                    <p className="text-slate-300 text-sm mb-2">"{review.text}"</p>
                  )}
                  {review.reply_text && (
                    <div className="mt-2 pl-3 border-l border-[#334155]">
                      <p className="text-xs text-slate-500 mb-1">Reply:</p>
                      <p className="text-slate-400 text-sm">"{review.reply_text}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
