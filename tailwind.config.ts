import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        card: "#1e293b",
        'card-dark': "#070d1a",
        accent: "#0ea5e9",
        muted: "#94a3b8",
        border: "#334155",
        'border-light': "rgba(255,255,255,0.05)",
        'border-divider': "rgba(255,255,255,0.06)",
      },
      fontSize: {
        'hero': '28px',
        'card-title': '13px',
        'axis-label': '11px',
      },
      letterSpacing: {
        'card-title': '0.05em',
      },
    },
  },
  plugins: [],
};
export default config;
