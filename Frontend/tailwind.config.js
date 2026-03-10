/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        "max-lg": "1400px",
        xl: "1920px", // Setting 1920px as the xl breakpoint
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"], // Add Poppins font
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
      colors: {
        "custom-green": "#031816",
        "custom-dark": "#030F0E",
        "custom-green-image": "#083A35",
        "custom-dark-image": "#061715",
      },
    },
  },
  plugins: [],
};
