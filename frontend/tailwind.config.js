/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        night: '#11162a',
        mist: '#edf2f7',
        sun: '#f4b942',
        sea: '#28b8a8',
        alert: '#e94f37',
      },
      boxShadow: {
        glow: '0 18px 60px rgba(11, 16, 32, 0.28)',
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at 20% 20%, rgba(40,184,168,0.18), transparent 25%), radial-gradient(circle at 80% 0%, rgba(244,185,66,0.18), transparent 18%), linear-gradient(180deg, #0b1020 0%, #11162a 100%)',
      },
    },
  },
  plugins: [],
};
