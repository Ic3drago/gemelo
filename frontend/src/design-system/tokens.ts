export const colors = {
  primary: {
    default: '#16a34a',   // forest-600
    light: '#22c55e',     // forest-500
    lighter: '#dcfce7',   // forest-100
    dark: '#14532d',      // forest-900
  },
  secondary: {
    default: '#65a30d',   // leaf-600
    light: '#84cc16',     // leaf-500
  },
  surface: {
    default: '#faf8f4',   // cream
    card: '#ffffff',
    muted: '#f5f5f4',     // stone-100
  },
  text: {
    primary: '#1c1917',   // stone-900
    secondary: '#57534e', // stone-600
    muted: '#a8a29e',     // stone-400
  },
  status: {
    success: '#16a34a',
    warning: '#d97706',
    danger: '#e11d48',
    info: '#0284c7',
  },
} as const;

export const radius = {
  sm: '0.375rem',   // 6px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  full: '9999px',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const shadow = {
  card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
  'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  'card-lg': '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
} as const;

export const typography = {
  display: 'text-4xl font-bold tracking-tight',
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-medium',
  body: 'text-base',
  small: 'text-sm',
  xs: 'text-xs',
  label: 'text-sm font-medium',
  mono: 'font-mono tabular-nums',
} as const;
