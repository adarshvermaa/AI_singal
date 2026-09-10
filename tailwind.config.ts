import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: "#0d131f",
        "surface-elevated": "#141c2e",
        border: "#1e293b",
        "border-subtle": "#172033",
        bull: {
          DEFAULT: "#10b981",
          light: "#34d399",
          glow: "rgba(16, 185, 129, 0.25)",
        },
        bear: {
          DEFAULT: "#f43f5e",
          light: "#fb7185",
          glow: "rgba(244, 63, 94, 0.25)",
        },
        ai: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          glow: "rgba(139, 92, 246, 0.25)",
        },
        tech: {
          cyan: "#06b6d4",
          amber: "#f59e0b",
          blue: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
