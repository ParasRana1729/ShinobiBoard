/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08090d",
        card: "#0f111a",
        surface: {
          DEFAULT: "#141724",
          base: "#08090d",
          card: "#0f111a",
          elevated: "#161926",
        },
        elevated: "#1a1e30",
        gold: "#f5c542",
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
        shinobi: {
          gold: "#f5c542",
          teal: "#14b8a6",
          flame: "#f97316",
          crimson: "#ef4444",
          violet: "#8b5cf6",
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(245, 158, 11, 0.2)",
        "glow-gold": "0 0 30px -5px rgba(245, 197, 66, 0.35)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        "glow-violet": "0 0 25px -5px rgba(139, 92, 246, 0.3)",
        "glow-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.3)",
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
