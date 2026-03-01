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
        /* ── Chicken palette: orange-forward primary ─────── */
        primary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        warm: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
        },
        calm: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
        },
        yolk: {
          50: "#FEFCE8",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
        },
        /* Warm tan for borders / muted surfaces */
        tan: {
          100: "#FFFBF5",
          200: "#F1E3D2",
          300: "#E5D3BE",
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
