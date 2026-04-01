export default function PackageBadge({ package: pkg }: { package: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    essentials: { bg: 'rgba(139, 139, 158, 0.1)', text: '#8b8b9e', border: 'rgba(139, 139, 158, 0.2)' },
    growth: { bg: 'rgba(147, 107, 218, 0.1)', text: '#926BD9', border: 'rgba(147, 107, 218, 0.25)' },
    scale: { bg: 'rgba(0, 255, 212, 0.1)', text: '#00FFD4', border: 'rgba(0, 255, 212, 0.25)' },
  };

  const color = colors[pkg as keyof typeof colors] || colors.essentials;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600',
        background: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
        letterSpacing: '0.02em',
      }}
    >
      {pkg.charAt(0).toUpperCase() + pkg.slice(1)}
    </span>
  );
}
