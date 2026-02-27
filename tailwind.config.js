/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0F14",
          50: "#0D1117",
          100: "#111827",
          200: "#0F172A",
          300: "#1F2937",
          400: "#374151",
        },
        accent: {
          DEFAULT: "#3ECF8E",
          50: "#0D2818",
          100: "#134E2E",
          200: "#1A7A47",
          300: "#22A55E",
          400: "#3ECF8E",
          500: "#6EDCAB",
          600: "#A3EACC",
        },
        surface: {
          DEFAULT: "#111827",
          raised: "#1A2332",
          overlay: "#0F172A",
        },
        border: {
          DEFAULT: "#1F2937",
          light: "#374151",
          accent: "#3ECF8E33",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(62, 207, 142, 0.15)",
        "glow-sm": "0 0 10px rgba(62, 207, 142, 0.1)",
        "glow-lg": "0 0 40px rgba(62, 207, 142, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #3ECF8E, #2DA872)",
        "gradient-accent-r": "linear-gradient(to right, #3ECF8E, #22A55E)",
        "gradient-surface": "linear-gradient(180deg, #111827, #0B0F14)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
