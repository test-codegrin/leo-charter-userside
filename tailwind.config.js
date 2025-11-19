// eslint-disable-next-line @typescript-eslint/no-require-imports
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",  // Add this - your app directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}",  // Add this if you have components folder
    "./node_modules/@heroui/theme/dist/components/**/*.js",  // Fix the heroui path
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-public-sans)', 'system-ui', 'sans-serif'],
        barlow: ['var(--font-barlow)'],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      dark: {
        colors: {
          primary: {DEFAULT: "#a48d56"},
        },
      },
    },
  })],
};
