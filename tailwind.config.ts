/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#090a0f", // Sumi Obsidian Charcoal
        card: "#111319", // Deep Stealth Surface
        surface: {
          DEFAULT: "#111319",
          base: "#090a0f",
          card: "#111319",
          elevated: "#171a23",
          hover: "#1e222f",
        },
        elevated: "#171a23",
        gold: "#e5a93c", // Antique Japanese Brass Gold
        text: {
          primary: "#f1f5f9", // Slate 100
          secondary: "#94a3b8", // Slate 400
          muted: "#64748b", // Slate 500
        },
        shinobi: {
          gold: "#e5a93c", // Refined Antique Gold
          amber: "#f59e0b",
          teal: "#0d9488", // Deep Japanese Pine / Teal
          flame: "#ea580c", // Torii Flame Orange
          crimson: "#e63946", // Blood Katana Red
          violet: "#7c3aed",
          steel: "#94a3b8",
        },
      },
      boxShadow: {
        "tactile-card": "0 4px 24px -1px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)",
        "tactile-btn": "0 1px 2px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.25)",
        "tactile-inset": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        glow: "0 0 24px -4px rgba(229, 169, 60, 0.25)",
        "glow-gold": "0 0 28px -4px rgba(229, 169, 60, 0.35)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.25)",
        "glow-flame": "0 0 24px -4px rgba(234, 88, 12, 0.25)",
        "glow-crimson": "0 0 24px -4px rgba(230, 57, 70, 0.3)",
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
