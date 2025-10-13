import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
        },
        success: {
          DEFAULT: "#16a34a",
        },
        warning: {
          DEFAULT: "#ca8a04",
        },
        error: {
          DEFAULT: "#dc2626",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
