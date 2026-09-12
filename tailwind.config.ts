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
        ink: "#f3eee4",
        sumi: "#1c1712",
        card: "#faf7f1",
        surface: {
          DEFAULT: "#faf7f1",
          base: "#f3eee4",
          card: "#faf7f1",
          elevated: "#ebe4d6",
          hover: "#e4dccb",
        },
        elevated: "#ebe4d6",
        gold: "#c4452d",
        text: {
          primary: "#1c1712",
          secondary: "#5c5348",
          muted: "#8a8074",
        },
        shinobi: {
          gold: "#c4452d",
          amber: "#c4452d",
          teal: "#3d5c4a",
          flame: "#a33b24",
          crimson: "#c4452d",
          violet: "#5c4a3d",
          steel: "#8a8074",
        },
      },
      boxShadow: {
        "tactile-card": "1px 1px 0 0 rgba(28, 23, 18, 0.12)",
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
