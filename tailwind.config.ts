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
        heading: ["var(--font-heading)", "Georgia", "serif"],
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
        "tactile-btn": "none",
        "tactile-inset": "none",
        glow: "none",
        "glow-gold": "none",
        "glow-emerald": "none",
        "glow-flame": "none",
        "glow-crimson": "none",
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
