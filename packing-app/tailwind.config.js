/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      animation: {
        'check-bounce': 'checkBounce 0.2s ease-out',
      },
      keyframes: {
        checkBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.88)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
