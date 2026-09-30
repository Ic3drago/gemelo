import React from 'react';

interface ChartProps {
  title: string;
  description?: string;
  height?: number;
  children: React.ReactNode;
}

export function Chart({ title, description, height = 224, children }: ChartProps) {
  return (
    <section aria-label={title}>
      <div className="mb-3"><h2 className="text-sm font-semibold">{title}</h2>{description && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{description}</p>}</div>
      <div role="img" aria-label={title} style={{ height }}>{children}</div>
    </section>
  );
}

export default Chart;