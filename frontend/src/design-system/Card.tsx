import React from 'react';

type CardVariant = 'flat' | 'elevated' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  flat: 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
  elevated: 'bg-white dark:bg-stone-900 shadow-card-md',
  outlined: 'bg-transparent border border-stone-200 dark:border-stone-800',
};

export function Card({
  variant = 'flat',
  padding = true,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-lg',
        variantClasses[variant],
        padding ? 'p-5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
