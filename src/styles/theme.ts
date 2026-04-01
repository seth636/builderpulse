// BuilderPulse Global Theme
// Single source of truth for all design tokens

export const theme = {
  colors: {
    background: '#0B1120',
    cardBg: '#111827',
    sidebar: '#070d1a',
    inputBg: '#1E293B',
    border: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.12)',
    accentBlue: '#3B82F6',
    accentGreen: '#10B981',
    accentAmber: '#F59E0B',
    accentRed: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
  },
  card: {
    bg: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
    shadow: '0 4px 24px rgba(0,0,0,0.2)',
    hoverBorder: 'rgba(255,255,255,0.12)',
    hoverTransform: 'translateY(-2px)',
  },
  font: 'Inter, sans-serif',
} as const;

export default theme;
