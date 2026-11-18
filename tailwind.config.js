/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: "#131921",
          subnav: "#232F3E",
          hover: "#2a3749",
          border: "#37475A",
          active: "#485769",
        },
        brand: {
          teal: "#0F766E",
          tealHover: "#115E59",
          tealLight: "#CCFBF1",
          tealDark: "#134E4A",
          amber: "#D97706",
          amberHover: "#B45309",
          amberLight: "#FEF3C7",
          gold: "#F59E0B",
          goldHover: "#D97706",
        },
        surface: {
          canvas: "#F3F4F6",
          card: "#FFFFFF",
          border: "#E5E7EB",
          muted: "#F9FAFB",
        },
        status: {
          available: "#059669",
          reserved: "#D97706",
          sold: "#DC2626",
          hidden: "#6B7280",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        amazon: "0 2px 5px 0 rgba(213,217,217,.5)",
      },
    },
  },
  plugins: [],
};
