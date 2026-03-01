import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b8dbff",
          300: "#7ac0ff",
          400: "#36a3ff",
          500: "#0084ff",
          600: "#0066db",
          700: "#0050b0",
          800: "#004491",
          900: "#003a78",
        },
        warm: {
          50: "#fff8f0",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
        },
        calm: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
        },
      },
      fontSize: {
        "kid-sm": ["1rem", { lineHeight: "1.5" }],
        "kid-base": ["1.25rem", { lineHeight: "1.6" }],
        "kid-lg": ["1.5rem", { lineHeight: "1.5" }],
        "kid-xl": ["2rem", { lineHeight: "1.3" }],
      },
      borderRadius: {
        kid: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
