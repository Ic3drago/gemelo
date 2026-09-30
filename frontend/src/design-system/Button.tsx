import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // brand-700 (#1F4D3A) instead of forest-600: white on forest-600 is only
  // 3.3:1, which fails AA for button labels under 18.66px.
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 focus-visible:ring-brand-600 shadow-sm',
  secondary:
    'bg-forest-50 text-forest-700 hover:bg-forest-100 active:bg-forest-200 focus-visible:ring-forest-400 border border-forest-200 dark:bg-forest-950 dark:text-forest-300 dark:border-forest-800 dark:hover:bg-forest-900',
  ghost:
    'bg-transparent text-stone-600 hover:bg-stone-100 active:bg-stone-200 focus-visible:ring-stone-400 dark:text-stone-300 dark:hover:bg-stone-800',
  danger:
    'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus-visible:ring-rose-600 shadow-sm',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}

export default Button;
