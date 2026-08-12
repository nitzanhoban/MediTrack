/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        status: {
          green: '#16a34a',
          greenBg: '#dcfce7',
          yellow: '#ca8a04',
          yellowBg: '#fef9c3',
          red: '#dc2626',
          redBg: '#fee2e2',
        },
      },
    },
  },
  plugins: [],
};
