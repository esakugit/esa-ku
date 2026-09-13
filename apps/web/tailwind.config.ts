import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16212C",
        // Sampled from the ESA-KU logo (blue/white/black/green).
        accent: {
          DEFAULT: "#2E3F92", // logo blue — brand/interactive
          soft: "#E7E9F7",
        },
        brandgreen: {
          DEFAULT: "#00512E", // logo green — success / active Badge
          soft: "#DFF0E6",
        },
        // Deliberately a different hue from the brand accent — this marks
        // "locked, pay to unlock" state, not brand identity (spec §10).
        flag: {
          DEFAULT: "#B4692A",
          soft: "#FBEEE0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
