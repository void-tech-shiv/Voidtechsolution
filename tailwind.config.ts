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
        // Void Neutral Foundations
        void: {
          black: "var(--bg-primary)",
          dark: "var(--bg-secondary)",
          charcoal: "var(--bg-surface)",
          surface: "var(--bg-surface-elevated)",
          border: "var(--border-primary)",
          subtle: "var(--border-subtle)",
          muted: "var(--text-muted)",
          light: "var(--text-secondary)",
          white: "var(--text-primary)",
        },
        // Electric Luminescent Accents
        electric: {
          purple: "var(--accent-purple)",
          violet: "var(--accent-purple-hover)",
          neon: "var(--accent-neon)",
          cyan: "var(--accent-cyan)",
          glow: "var(--accent-purple-glow)",
        },
        // Semantic Status Tokens
        status: {
          success: "var(--color-success)",
          "success-bg": "var(--color-success-bg)",
          "success-border": "var(--color-success-border)",
          warning: "var(--color-warning)",
          "warning-bg": "var(--color-warning-bg)",
          "warning-border": "var(--color-warning-border)",
          error: "var(--color-error)",
          "error-bg": "var(--color-error-bg)",
          "error-border": "var(--color-error-border)",
          info: "var(--color-info)",
          "info-bg": "var(--color-info-bg)",
          "info-border": "var(--color-info-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-xs": "0 0 10px -2px rgba(139, 92, 246, 0.2)",
        "glow-sm": "0 0 16px -3px rgba(139, 92, 246, 0.28)",
        "glow-md": "0 0 28px -4px rgba(139, 92, 246, 0.38)",
        "glow-lg": "0 0 44px -6px rgba(139, 92, 246, 0.48)",
        "glow-neon": "0 0 55px -6px rgba(168, 85, 247, 0.55)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
        "glass-elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)",
      },
      backgroundImage: {
        "void-glow-radial": "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.18) 0%, transparent 65%)",
        "void-glow-bottom": "radial-gradient(circle at 50% 100%, rgba(124, 58, 237, 0.12) 0%, transparent 60%)",
        "void-card-gradient": "linear-gradient(180deg, rgba(24, 24, 34, 0.75) 0%, rgba(10, 10, 15, 0.9) 100%)",
        "void-accent-gradient": "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a855f7 100%)",
      },
      animation: {
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
        "glow-breathe": "glowBreathe 5s ease-in-out infinite",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.82" },
        },
        glowBreathe: {
          "0%, 100%": { filter: "drop-shadow(0 0 14px rgba(139, 92, 246, 0.25))" },
          "50%": { filter: "drop-shadow(0 0 28px rgba(139, 92, 246, 0.5))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
