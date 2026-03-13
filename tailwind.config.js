/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        cream: '#faf7f2',
        'library-green': '#1a3a2a',
        gold: '#c9a84c',
        'near-black': '#1c1917',
        divider: '#e8e0d5',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
