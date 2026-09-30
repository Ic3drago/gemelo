/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand greens, previously hardcoded as #1F4D3A / #6FA35B hex values
        // across components, charts and the landing page.
        brand: {
          50: '#eef5f0', 100: '#d6e6dc', 200: '#aecdbb', 300: '#7fae94',
          400: '#578a6e', 500: '#3c6b52', 600: '#2b5440', 700: '#1F4D3A',
          800: '#1a3f30', 900: '#153126', 950: '#0c1f18',
        },
        accent: {
          50: '#f2f8ee', 100: '#e0eed6', 200: '#c3ddb0', 300: '#a3ca86',
          400: '#84b662', 500: '#6FA35B', 600: '#578a47', 700: '#476e3a',
          800: '#3a5831', 900: '#30492a', 950: '#172514',
        },
        forest: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        leaf: {
          50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264',
          400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f',
          800: '#3f6212', 900: '#365314', 950: '#1a2e05',
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
        rose: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337', 950: '#4c0519',
        },
        sky: {
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
          400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
          800: '#075985', 900: '#0c4a6e', 950: '#082f49',
        },
        stone: {
          50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917', 950: '#0c0a09',
        },
        cream: {
          DEFAULT: '#faf8f4',
          dark: '#f2ede4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontVariantNumeric: ['tabular-nums'],
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom)' },
        '.pt-safe': { paddingTop: 'env(safe-area-inset-top)' },
        '.pl-safe': { paddingLeft: 'env(safe-area-inset-left)' },
        '.pr-safe': { paddingRight: 'env(safe-area-inset-right)' },
        '.mb-safe': { marginBottom: 'env(safe-area-inset-bottom)' },
        '.nums': { fontVariantNumeric: 'tabular-nums' },
      });
    },
  ],
};
