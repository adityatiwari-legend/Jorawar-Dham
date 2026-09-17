import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sandstone: {
          50: "#fdfbf7",
          100: "#f9f4ea",
          200: "#f2e7d1",
          300: "#e8d3b0",
          400: "#d9b685",
          500: "#c79659",
          600: "#b57d44",
          700: "#976237",
          800: "#7b4f30",
          900: "#64412a",
        },
        saffron: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        maroon: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        marble: {
          50: "#ffffff",
          100: "#fafaf8",
          200: "#f5f4ef",
          300: "#eceae0",
          400: "#dfdcce",
        },
      },
      fontFamily: {
        devanagari: ["var(--font-devanagari)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        devotional: "0 4px 20px -2px rgba(181, 125, 68, 0.12), 0 2px 6px -2px rgba(181, 125, 68, 0.08)",
        "devotional-lg": "0 10px 30px -4px rgba(136, 19, 55, 0.15), 0 4px 12px -2px rgba(181, 125, 68, 0.1)",
        "gold-glow": "0 0 25px -3px rgba(245, 158, 11, 0.35)",
      },
      backgroundImage: {
        "sacred-pattern": "radial-gradient(#b57d44 0.75px, transparent 0.75px), radial-gradient(#b57d44 0.75px, #fcfbf7 0.75px)",
      },
    },
  },
  plugins: [],
};

export default config;
