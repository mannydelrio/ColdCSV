import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          bg: "#FAFAF8",
          text: "#1A1A18",
          green: "#2A6B4A",
          muted: "#5A5A54",
          subtle: "#9A9A94",
          border: "#E8E8E2",
          card: "#FFFFFF",
        },
      },
      borderRadius: {
        pill: "100px",
      },
    },
  },
  plugins: [],
};

export default config;
