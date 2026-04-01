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
        // SearchAtlas-inspired design tokens
        background: "#000000",
        'background-secondary': "#0d1117",
        card: "#0d1117",
        'card-dark': "#050508",
        'input-bg': "#1a1a2e",
        accent: "#00FFD4", // Teal - primary SearchAtlas accent
        'accent-purple': "#926BD9", // Purple - secondary SearchAtlas accent
        'accent-green': "#10B981",
        'accent-amber': "#F59E0B",
        'accent-red': "#EF4444",
        muted: "#8b8b9e",
        secondary: "#c4c4d4",
        border: "rgba(147, 107, 218, 0.15)", // Subtle purple border
        'border-hover': "rgba(147, 107, 218, 0.3)",
        'border-light': "rgba(255,255,255,0.06)",
        'border-divider': "rgba(147, 107, 218, 0.1)",
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
