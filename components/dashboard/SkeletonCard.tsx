'use client';

type Props = {
  height?: string;
  className?: string;
};

export default function SkeletonCard({ height = 'h-48', className = '' }: Props) {
  return (
    <div 
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(147, 107, 218, 0.06) 0%, rgba(13, 17, 23, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
        border: '1px solid rgba(147, 107, 218, 0.12)',
      }}
    >
      <div className={`bg-[rgba(147,107,218,0.15)] rounded ${height} animate-skeleton`} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3 px-4">
      <div className="h-4 bg-[rgba(147,107,218,0.15)] rounded flex-1 animate-skeleton" />
      <div className="h-4 bg-[rgba(147,107,218,0.15)] rounded w-20 animate-skeleton" />
      <div className="h-4 bg-[rgba(147,107,218,0.15)] rounded w-20 animate-skeleton" />
      <div className="h-4 bg-[rgba(147,107,218,0.15)] rounded w-20 animate-skeleton" />
    </div>
  );
}
