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
        heading: ["var(--font-heading)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#0c0e12",
        sumi: "#f3eee4",
        card: "#14171e",
        surface: {
          DEFAULT: "#14171e",
          base: "#0c0e12",
          card: "#14171e",
          elevated: "#1b1f28",
          hover: "#222733",
        },
        elevated: "#1b1f28",
        gold: "#e05638",
        text: {
          primary: "#f3eee4",
          secondary: "#9ba1ad",
          muted: "#636a77",
        },
        shinobi: {
          gold: "#e05638",
          amber: "#e5a93c",
          teal: "#14b8a6",
          flame: "#f87171",
          crimson: "#ef4444",
          violet: "#a78bfa",
          steel: "#9ba1ad",
        },
      },
      boxShadow: {
        "tactile-card": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(243, 238, 228, 0.08)",
        "tactile-card-hover": "0 4px 14px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(243, 238, 228, 0.16)",
        "tactile-podium": "0 4px 20px -2px rgba(224, 86, 56, 0.2), 0 0 0 1px rgba(224, 86, 56, 0.4)",
        "tactile-btn": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "tactile-inset": "inset 0 1px 2px rgba(0, 0, 0, 0.4)",
        glow: "0 0 16px rgba(224, 86, 56, 0.25)",
        "glow-gold": "0 0 18px rgba(224, 86, 56, 0.35)",
        "glow-teal": "0 0 16px rgba(20, 184, 166, 0.3)",
        "glow-flame": "0 0 16px rgba(248, 113, 113, 0.3)",
        "glow-crimson": "0 0 16px rgba(239, 68, 68, 0.35)",
      },
      borderRadius: {
        "2xl": "0.375rem",
        "3xl": "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
