export default function PackageBadge({ package: pkg }: { package: string }) {
  const colors = {
    essentials: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    growth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    scale: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const color = colors[pkg as keyof typeof colors] || colors.essentials;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {pkg.charAt(0).toUpperCase() + pkg.slice(1)}
    </span>
  );
}
