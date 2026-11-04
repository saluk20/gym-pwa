const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: v('c-canvas'), card: v('c-card'), card2: v('c-card2'), ink: v('c-ink'), muted: v('c-muted'),
        brand: v('c-brand'), onbrand: v('c-onbrand'), hot: v('c-hot'), calories: v('c-series'), active: v('c-volume'),
        heart: v('c-danger'), danger: v('c-danger'), rest: v('c-rest'),
      },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '24px', pill: '999px' },
      boxShadow: { card: 'var(--sh-card)', nav: 'var(--sh-nav)' },
    },
  },
  plugins: [],
};
