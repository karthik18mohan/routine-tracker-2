import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        headerBlue: "var(--header-blue)",
        panelPink: "var(--panel-pink)",
        gridLine: "var(--grid-line)",
        mutedText: "var(--muted-text)",
        accentFill: "var(--accent-fill)",
        checkFill: "var(--check-fill)"
      },
      fontFamily: {
        serifDisplay: "var(--font-serif)",
        sansDisplay: "var(--font-sans)"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
