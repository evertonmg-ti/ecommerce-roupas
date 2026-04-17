import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f5efe6",
        espresso: "#2b2118",
        terracotta: "#b85c38",
        moss: "#6f7b5c"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 70px rgba(43, 33, 24, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

