import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#fffdf5",
          100: "#fef9e7",
          200: "#fdf0c5",
          300: "#fbe499",
          400: "#f8d055",
          500: "#ffb31a", // User requested primary accent
          600: "#e69c05",
          700: "#bf7c00",
          800: "#996000",
          900: "#7a4c00",
          DEFAULT: "#ffb31a",
        },
        surface: {
          light: "#ffffff",
          dark: "#121212",
          darker: "#0a0a0a",
          card: "var(--surface-card)",
          cardHover: "var(--surface-card-hover)",
          border: "var(--surface-border)",
        },
      },
      fontFamily: {
        bengali: [
          "var(--font-noto-sans-bengali)",
          "var(--font-hind-siliguri)",
          "'Noto Sans Bengali'",
          "'Hind Siliguri'",
          "Kalpurush",
          "SolaimanLipi",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
