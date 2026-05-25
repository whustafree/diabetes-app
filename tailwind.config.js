/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glucose: {
          low: '#60a5fa',
          normal: '#22c55e',
          elevated: '#eab308',
          high: '#f97316',
          danger: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
