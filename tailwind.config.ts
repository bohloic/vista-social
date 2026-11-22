import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['var(--font-fredoka)', 'Fredoka', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#7C3AED', // Violet Électrique
          hover: '#6D28D9',
          light: '#8B5CF6',
          dark: '#5B21B6',
        },
        accent: {
          DEFAULT: '#FF4D6D', // Corail Pop
          hover: '#E11D48',
          light: '#FF758F',
        },
        spark: {
          DEFAULT: '#FACC15', // Jaune Étincelle
          hover: '#EAB308',
        },
        night: {
          DEFAULT: '#1E1B4B', // Indigo Nuit
          light: '#312E81',
          dark: '#0F0E2A',
        },
        soft: {
          DEFAULT: '#F5F3FF', // Lilas Doux
          pure: '#FAF5FF',
        },
      },
    },
  },
  plugins: [],
};

export default config;
