'use client';

type Props = {
  height?: string;
  className?: string;
};

export default function SkeletonCard({ height = 'h-48', className = '' }: Props) {
  return (
    <div className={`bg-[#1e293b] border border-border-light rounded-xl p-6 ${className}`}>
      <div className={`bg-slate-700 rounded ${height} animate-skeleton`} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3 px-4">
      <div className="h-4 bg-slate-700 rounded flex-1 animate-skeleton" />
      <div className="h-4 bg-slate-700 rounded w-20 animate-skeleton" />
      <div className="h-4 bg-slate-700 rounded w-20 animate-skeleton" />
      <div className="h-4 bg-slate-700 rounded w-20 animate-skeleton" />
    </div>
  );
}
