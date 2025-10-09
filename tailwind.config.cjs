/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        background: {
          DEFAULT: "#ffffff",
          dark: "#242424",
        },
        foreground: {
          DEFAULT: "#213547",
          dark: "rgba(255,255,255,0.87)",
        },
        primary: {
          DEFAULT: "#5b8770a1",
          dark: "#747bff",
        },
        accent: {
          DEFAULT: "#f3f4f6",
          dark: "#1a1a1a",
        },
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      addBase({
        'html, body': {
          fontFamily: theme('fontFamily.mono'),
          fontWeight: 400,
          lineHeight: 1.5,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          colorScheme: 'light dark',
          backgroundColor: theme('colors.background.DEFAULT'),
          color: theme('colors.foreground.DEFAULT'),
        },
        '@media (prefers-color-scheme: dark)': {
          'html, body': {
            backgroundColor: theme('colors.background.dark'),
            color: theme('colors.foreground.dark'),
          },
        },
      });
    },
  ],
};
