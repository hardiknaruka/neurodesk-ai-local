import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#152B50",
          blue: "#1769AA",
          teal: "#16856B",
          pale: "#EEF4FA",
          gray: "#586579",
          gold: "#D3AA27",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
