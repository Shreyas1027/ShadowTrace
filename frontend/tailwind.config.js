/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FDFBF7',
        glow: '#FFF8ED',
      },
      boxShadow: {
        card: '0 20px 40px -15px rgba(0,0,0,0.06)',
        float: '0 30px 60px -20px rgba(15,23,42,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
