import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/web/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        ink: "#0F172A",
        surface: "#F8FAFC",
        accent: {
          DEFAULT: "#2554D7", // Brighter, professional engineering royal blue
          hover: "#1D46B8",
          soft: "#EFF4FE",
          muted: "#C2D3FA",
        },
        brandgreen: {
          DEFAULT: "#057A55",
          soft: "#EDFDF5",
          muted: "#A4ECC6",
        },
        flag: {
          DEFAULT: "#C27803",
          soft: "#FEF7EC",
          muted: "#FCE4A6",
        },
        neutral: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "card-hover": "0 4px 12px 0 rgba(15, 23, 42, 0.08)",
        "card-lg": "0 10px 25px -3px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        sm: "0.25rem", // 4px
        DEFAULT: "0.375rem", // 6px
        md: "0.375rem", // 6px
        lg: "0.5rem", // 8px
        xl: "0.625rem", // 10px
        "2xl": "0.75rem", // 12px
        "3xl": "1rem", // 16px
      },
    },
  },
  plugins: [],
};

export default config;
