import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b1020',
        panel: '#141c31',
        border: '#2c3858',
        accent: '#55a8ff'
      }
    }
  },
  plugins: []
};

export default config;
