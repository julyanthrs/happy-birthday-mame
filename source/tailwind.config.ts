import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0f050b',
        plum: '#1d0c16',
        burgundy: '#4a1428',
        wine: '#7a2340',
        rose: '#d9a3ae',
        blush: '#efcfd3',
        champagne: '#ead4a4',
        gold: '#c9a35f',
        cream: '#f4e8d2',
        pearl: '#fbf6ee',
        ink: '#3b1d26',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        hand: ['"Reenie Beanie"', '"Bradley Hand"', 'cursive'],
        sign: ['"La Belle Aurore"', '"Snell Roundhand"', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config;
