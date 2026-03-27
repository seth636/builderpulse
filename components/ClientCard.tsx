import Link from 'next/link';
import PackageBadge from './PackageBadge';

interface ClientCardProps {
  name: string;
  slug: string;
  website_url?: string | null;
  pm_name?: string | null;
  package: string;
}

export default function ClientCard({
  name,
  slug,
  website_url,
  pm_name,
  package: pkg,
}: ClientCardProps) {
  return (
    <Link href={`/client/${slug}`}>
      <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:-translate-y-0.5 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <PackageBadge package={pkg} />
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
