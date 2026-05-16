import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f97316",
        ink: "#7c2d12",
        muted: "#9a3412",
        line: "#fed7aa",
        wash: "#fff7f1",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(124, 45, 18, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
