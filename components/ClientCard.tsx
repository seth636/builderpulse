import Link from 'next/link';
import PackageBadge from './PackageBadge';

function getHealthScoreColor(score: number): string {
  if (score >= 90) return '#00FFD4';
  if (score >= 70) return '#926BD9';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

interface ConnectedServices {
  ga4?: boolean;
  gsc?: boolean;
  ghl?: boolean;
  meta?: boolean;
  reviews?: boolean;
}

const SERVICE_DOTS: { key: keyof ConnectedServices; label: string; color: string }[] = [
  { key: 'ga4',     label: 'GA4',     color: '#F59E0B' },
  { key: 'gsc',     label: 'GSC',     color: '#926BD9' },
  { key: 'ghl',     label: 'GHL',     color: '#00FFD4' },
  { key: 'meta',    label: 'Meta',    color: '#818CF8' },
  { key: 'reviews', label: 'Reviews', color: '#F472B6' },
];

interface ClientCardProps {
  name: string;
  slug: string;
  website_url?: string | null;
  pm_name?: string | null;
  package: string;
  healthScore?: number | null;
  alertCount?: number;
  connectedServices?: ConnectedServices;
}

export default function ClientCard({
  name,
  slug,
  website_url,
  pm_name,
  package: pkg,
  healthScore,
  alertCount = 0,
  connectedServices = {},
}: ClientCardProps) {
  const connectedCount = SERVICE_DOTS.filter(s => connectedServices[s.key]).length;

  return (
    <Link href={`/client/${slug}`} style={{ textDecoration: 'none' }}>
      <div className="bp-card cursor-pointer" style={{ height: '100%' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', margin: 0, flex: 1, paddingRight: '8px' }}>
            {name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {alertCount > 0 && (
              <span style={{
                background: '#EF4444', color: '#FFFFFF',
                fontSize: '11px', fontWeight: '700',
                padding: '2px 7px', borderRadius: '999px',
              }}>
                {alertCount}
              </span>
            )}
            {healthScore != null && (
              <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '42px', height: '42px', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="rgba(147, 107, 218, 0.15)" strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={getHealthScoreColor(healthScore)}
                    strokeWidth="3"
                    strokeDasharray={`${healthScore}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF', fontWeight: '700', fontSize: '10px',
                }}>
                  {healthScore}
                </span>
              </div>
            )}
            <PackageBadge package={pkg} />
          </div>
        </div>

        {/* URL */}
        {website_url && (
          <p style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {website_url}
          </p>
        )}

        {/* PM */}
        {pm_name && (
          <p style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>PM:</span> {pm_name}
          </p>
        )}

        {/* Connected service dots */}
        {connectedCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '14px' }}>
            {SERVICE_DOTS.map(service => (
              connectedServices[service.key] && (
                <div
                  key={service.key}
                  title={service.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '999px',
                    background: `${service.color}12`,
                    border: `1px solid ${service.color}30`,
                  }}
                >
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: service.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '10px', color: service.color, fontWeight: '500' }}>
                    {service.label}
                  </span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
