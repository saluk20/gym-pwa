/** Tokens extraídos del contrato de diseño (Fitness app home screen, light only, una sola marca). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F2F2EF',
        card: '#FFFFFF',
        ink: '#111111',
        muted: '#8A8A90',
        brand: '#F2704F',
        calories: '#F5A524',
        active: '#4C8DFF',
        heart: '#FF4D6D',
      },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '24px', pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,.04), 0 8px 24px rgba(17,17,17,.05)',
        nav: '0 8px 32px rgba(17,17,17,.14)',
      },
    },
  },
  plugins: [],
};
