/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ← yeh line important hai React files ke liye
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}