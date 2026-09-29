import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse bg-stone-200 dark:bg-stone-700',
        rounded ? 'rounded-full' : 'rounded-lg',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0" rounded />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
