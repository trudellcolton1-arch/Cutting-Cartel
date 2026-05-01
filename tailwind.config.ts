import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0a0a0b",
          800: "#111114",
          700: "#1a1a1f",
          600: "#26262d",
          500: "#3a3a44",
        },
        bone: {
          50: "#fafaf7",
          100: "#f4f3ee",
          200: "#e7e5dc",
        },
        cartel: {
          // signature gold accent for The Cutting Cartel
          50: "#fff8e1",
          100: "#ffeaa8",
          300: "#f5c46b",
          500: "#d99a2b",
          600: "#b87e1e",
          700: "#8a5d12",
        },
        blade: {
          // electric accent
          400: "#5cf2c8",
          500: "#10d39a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        display: ["'Playfair Display'", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(217,154,43,0.25), 0 10px 40px -10px rgba(217,154,43,0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 50% 0%, rgba(217,154,43,0.18), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
