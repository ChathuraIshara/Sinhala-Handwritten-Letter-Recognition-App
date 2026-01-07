/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sinhala: ['Noto Sans Sinhala', 'Arial Unicode MS', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

