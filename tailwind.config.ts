import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0B",
        paper: "#FAF8F6",
        surface: "#F0ECE6",
        moto: "#C8C8C8",
        detail: "#EEEEEE",
        accent: {
          DEFAULT: "#FF6813",
          hover: "#E65E12",
          muted: "rgb(255 104 19 / 0.14)",
        },
        stock: {
          DEFAULT: "#1FA855",
          hover: "#178A46",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        body: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        aggressive: "0.08em",
      },
      maxWidth: {
        site: "90rem",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "mega-menu-in": "mega-menu-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both",
        "mega-menu-item": "mega-menu-item 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        "mega-menu-promo": "mega-menu-promo 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "spec-marquee": "spec-marquee 28s linear infinite",
        "search-in": "search-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "search-scan": "search-scan 1.1s ease-in-out infinite",
        "gallery-play-ping": "gallery-play-ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "gallery-video-in": "gallery-video-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "mega-menu-in": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "mega-menu-item": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "mega-menu-promo": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "spec-marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "search-in": {
          from: { opacity: "0", transform: "translateY(18px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "search-scan": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "gallery-play-ping": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(1.85)", opacity: "0" },
        },
        "gallery-video-in": {
          from: { opacity: "0", transform: "translateY(-50%) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(-50%) scale(1)" },
        },
      },
    },
  },
} satisfies Config;

export default config;
