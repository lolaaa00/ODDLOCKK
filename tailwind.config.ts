import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Slightly larger base scale throughout
        xs:   ["0.8125rem", { lineHeight: "1.4" }],   // 13px (was 12px)
        sm:   ["0.9375rem", { lineHeight: "1.5" }],   // 15px (was 14px)
        base: ["1.0625rem", { lineHeight: "1.65" }],  // 17px (was 16px)
        lg:   ["1.1875rem", { lineHeight: "1.6" }],   // 19px (was 18px)
        xl:   ["1.375rem",  { lineHeight: "1.4" }],   // 22px (was 20px)
        "2xl":["1.625rem",  { lineHeight: "1.3" }],   // 26px (was 24px)
        "3xl":["2rem",      { lineHeight: "1.2" }],   // 32px (was 30px)
        "4xl":["2.5rem",    { lineHeight: "1.1" }],   // 40px (was 36px)
      },
      colors: {
        abyss:           "#2A100C",
        chamber:         "#3D1A16",
        "deep-vault":    "#8B0A14",
        "bio-glow":      "#DDD0CC",
        canopy:          "#C8B8B0",
        "seal-verdict":  "#DDD0CC",
        "source-confirm":"#C8B8B0",
        "dispute-signal":"#DDD0CC",
        "invalid-alert": "#E27070",
        "push-neutral":  "#A8917F",
        "ink-text":      "#F0E6E2",
        "glass-line":    "rgba(240,230,226,0.10)",
        "soft-panel":    "rgba(61,26,22,0.85)",
        "dim-label":     "rgba(240,230,226,0.72)",
      },
      fontFamily: {
        staatliches: ["var(--font-staatliches)", "sans-serif"],
        changa:      ["var(--font-changa-one)", "sans-serif"],
        nunito:      ["var(--font-nunito-sans)", "sans-serif"],
        azeret:      ["var(--font-azeret-mono)", "monospace"],
        exo:         ["var(--font-exo-2)", "sans-serif"],
      },
      boxShadow: {
        "ember-glow":  "0 0 24px rgba(176,16,32,0.40), 0 0 8px rgba(176,16,32,0.20)",
        "gold-glow":   "0 0 20px rgba(212,160,23,0.30)",
        "dispute":     "0 0 20px rgba(238,192,68,0.25)",
        "invalid":     "0 0 20px rgba(226,112,112,0.30)",
      },
      animation: {
        "verdict-stamp":"verdict-stamp 0.35s ease-out both",
        "capsule-enter":"capsule-enter 0.4s ease-out both",
        "route-in":     "route-in 0.25s ease-out both",
      },
      keyframes: {
        "verdict-stamp": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "capsule-enter": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "route-in": {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
