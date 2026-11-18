/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
      },
      colors: {
        clinixpulse: {
          primary: '#123A3A',
          secondary: '#287C75',
          accent: '#C9A45C',
          canvas: '#F7FAF8',
          surface: '#FFFFFF',
          border: '#D9E6E2',
          text: '#10201F',
          muted: '#4E6460',
          subtle: '#7D908C',
        },
        brand: {
          500: '#2563EB',
          600: '#1D4ED8',
          900: '#1E3A8A',
        },
        ui: {
          bg: '#F7FAF8',
          card: '#FFFFFF',
          text: '#10201F',
          muted: '#4E6460',
        },
        status: {
          success: '#2E7D5B',
          warning: '#B7791F',
          danger: '#B94A48',
          info: '#287C75',
        },
        medical: {
          primary: '#123A3A',
          secondary: '#287C75',
          background: '#F7FAF8',
          sidebar: '#123A3A',
          card: '#FFFFFF',
          border: '#D9E6E2',
          text: '#10201F',
          muted: '#4E6460',
          success: '#2E7D5B',
          warning: '#B7791F',
          danger: '#B94A48',
        },
      },
      boxShadow: {
        'clinixpulse-xs': '0 1px 2px rgba(18, 58, 58, 0.04)',
        'clinixpulse-sm': '0 2px 8px rgba(18, 58, 58, 0.05)',
        'clinixpulse-md': '0 8px 24px rgba(18, 58, 58, 0.07)',
        'clinixpulse-lg': '0 16px 36px rgba(18, 58, 58, 0.10)',
        card: '0 2px 12px rgba(18, 58, 58, 0.04)',
        soft: '0 8px 24px rgba(18, 58, 58, 0.06)',
      },
      borderRadius: {
        card: '16px',
      },
      backgroundImage: {
        'medical-active': 'linear-gradient(130deg, #123A3A, #287C75)',
      },
    },
  },
  plugins: [],
};
