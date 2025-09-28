import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'lofi-sand': '#f4ede2',
        'lofi-tea': '#c5d4c0',
        'lofi-ink': '#1f1d2b',
        'lofi-dawn': '#ffcece',
        'lofi-sunset': '#f6b8b8',
        'lofi-night': '#31364d',
      },
      fontFamily: {
        display: ['"DM Sans"', 'Inter', ...defaultTheme.fontFamily.sans],
        body: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        card: '0 20px 45px -25px rgba(31, 29, 43, 0.45)',
      },
    },
  },
  plugins: [],
}
