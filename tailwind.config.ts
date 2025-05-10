/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#161622",
        secondary: {
          DEFAULT: "#FF9C01",
          100: "#FF9001",
          200: "#FF8E01",
        },
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
        },
        gray: {
          100: "#CDCDE0",
        },
      },
      fontFamily: {
        othin: ["Optima-Thin", "sans-serif"],
        oextralight: ["Optima-ExtraLight", "sans-serif"],
        olight: ["Optima-Light", "sans-serif"],
        oregular: ["Optima-Regular", "sans-serif"],
        omedium: ["Optima-Medium", "sans-serif"],
        osemibold: ["Optima-SemiBold", "sans-serif"],
        obold: ["Optima-Bold", "sans-serif"],
        oextrabold: ["Optima-ExtraBold", "sans-serif"],
        oblack: ["Optima-Black", "sans-serif"],
      },
    },
  },
  plugins: [],
};