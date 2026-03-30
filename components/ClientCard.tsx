import Link from 'next/link';
import PackageBadge from './PackageBadge';

function getHealthScoreColor(score: number): string {
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#0ea5e9';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

interface ClientCardProps {
  name: string;
  slug: string;
  website_url?: string | null;
  pm_name?: string | null;
  package: string;
  healthScore?: number | null;
  alertCount?: number;
}

export default function ClientCard({
  name,
  slug,
  website_url,
  pm_name,
  package: pkg,
  healthScore,
  alertCount = 0,
}: ClientCardProps) {
  return (
    <Link href={`/client/${slug}`}>
      <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:-translate-y-0.5 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {alertCount}
              </span>
            )}
            {healthScore != null && (
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#374151" strokeWidth="4"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getHealthScoreColor(healthScore)} strokeWidth="4" strokeDasharray={`${healthScore}, 100`}/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold" style={{ fontSize: '9px' }}>{healthScore}</span>
              </div>
            )}
            <PackageBadge package={pkg} />
          </div>
        </div>
        {website_url && (
          <p className="text-sm text-muted mb-2 truncate">{website_url}</p>
        )}
        {pm_name && (
          <p className="text-sm text-muted">
            <span className="text-white/60">PM:</span> {pm_name}
          </p>
        )}
      </div>
    </Link>
  );
}
