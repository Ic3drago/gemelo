'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StatProps {
  label: string;
  value: number;
  unit?: string;
  prefix?: string;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
  decimals?: number;
}

function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    startRef.current = start;

    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now);
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, decimals]);

  return current;
}

export function Stat({ label, value, unit, prefix, icon, trend, className = '', decimals = 0 }: StatProps) {
  const animated = useCountUp(value, 1200, decimals);

  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-forest-600 dark:text-forest-400">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          {prefix && <span className="text-base text-stone-500 dark:text-stone-400">{prefix}</span>}
          <span className="text-3xl font-bold text-stone-900 dark:text-stone-50 nums tabular-nums">
            {animated.toLocaleString('es-BO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
          </span>
          {unit && <span className="text-sm text-stone-400 dark:text-stone-500">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${trend >= 0 ? 'text-forest-600' : 'text-rose-600'}`}>
            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            <span className="text-stone-400">vs mes anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stat;
