/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F5',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#20242B',
          muted: '#686F78',
          faint: '#9A9FA6',
        },
        line: '#E5E2D9',
        'line-strong': '#D3CFC2',
        accent: {
          DEFAULT: '#3B3A8C',
          hover: '#2E2D72',
          tint: '#EEEDFA',
          text: '#3B3A8C',
        },
        success: {
          DEFAULT: '#2F7D5B',
          tint: '#E7F3EC',
        },
        warning: {
          DEFAULT: '#A8721E',
          tint: '#FBF1DF',
        },
        danger: {
          DEFAULT: '#B3432E',
          tint: '#FBEAE6',
        },
      },
      fontFamily: {
        display: ['"Manrope"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(32, 36, 43, 0.04), 0 4px 14px rgba(32, 36, 43, 0.04)',
        lift: '0 6px 20px rgba(32, 36, 43, 0.08)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
