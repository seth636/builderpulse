import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Phase 1 design tokens — exact values from Hammad's spec
        background: "#0B1120",
        card: "#111827",
        'card-dark': "#070d1a",
        'input-bg': "#1E293B",
        accent: "#3B82F6",
        'accent-green': "#10B981",
        'accent-amber': "#F59E0B",
        'accent-red': "#EF4444",
        muted: "#94A3B8",
        secondary: "#CBD5E1",
        border: "rgba(255,255,255,0.06)",
        'border-hover': "rgba(255,255,255,0.12)",
        'border-light': "rgba(255,255,255,0.06)",
        'border-divider': "rgba(255,255,255,0.06)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'hero': '28px',
        'card-title': '13px',
        'axis-label': '11px',
      },
      letterSpacing: {
        'card-title': '0.05em',
      },
      borderRadius: {
        'card': '16px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.2)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
