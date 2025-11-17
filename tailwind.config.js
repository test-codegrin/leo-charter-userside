// tailwind.config.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/(input|form).js",
  ],
  theme: {
    extend: {
      fontFamily: {
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
  }
    
  )],
};