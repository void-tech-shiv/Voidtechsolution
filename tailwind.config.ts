import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: {
          black: "#050507",
          dark: "#0a0a0f",
          charcoal: "#121218",
          surface: "#181822",
          border: "#262636",
          muted: "#88889c",
          light: "#e2e2ec",
          white: "#f8f8fc",
        },
        electric: {
          purple: "#8b5cf6",
          violet: "#7c3aed",
          neon: "#a855f7",
          cyan: "#06b6d4",
          fuchsia: "#d946ef",
          glow: "rgba(139, 92, 246, 0.4)",
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(139, 92, 246, 0.25)",
        "glow-md": "0 0 25px -4px rgba(139, 92, 246, 0.35)",
        "glow-lg": "0 0 40px -5px rgba(139, 92, 246, 0.45)",
        "glow-neon": "0 0 50px -5px rgba(168, 85, 247, 0.5)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "void-glow-radial": "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
        "void-card-gradient": "linear-gradient(180deg, rgba(24, 24, 34, 0.7) 0%, rgba(10, 10, 15, 0.85) 100%)",
      },
      animation: {
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
        "glow-breathe": "glowBreathe 5s ease-in-out infinite",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        glowBreathe: {
          "0%, 100%": { filter: "drop-shadow(0 0 15px rgba(139, 92, 246, 0.25))" },
          "50%": { filter: "drop-shadow(0 0 28px rgba(139, 92, 246, 0.45))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

