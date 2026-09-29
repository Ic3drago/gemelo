import React from 'react';

interface LogoProps {
  size?: number;
  showName?: boolean;
  className?: string;
}

export function Logo({ size = 32, showName = true, className = '' }: LogoProps) {
  return (
    <div className={['flex items-center gap-2.5', className].join(' ')}>
      {/* Isotipo: circle with leaf suggesting a cycle */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer ring */}
        <circle cx="16" cy="16" r="14" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
        {/* Inner leaf shape */}
        <path
          d="M16 22C16 22 10 18 10 13C10 9.13 13.13 8 16 8C18.87 8 22 9.13 22 13C22 18 16 22 16 22Z"
          fill="#16a34a"
          fillOpacity="0.15"
          stroke="#16a34a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Stem */}
        <path d="M16 22V26" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" />
        {/* Vein */}
        <path d="M16 14L13 17" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {showName && (
        <div className="leading-tight">
          <span className="font-bold text-stone-900 dark:text-stone-50 tracking-tight">Gemelo</span>
          <span className="font-light text-forest-600 dark:text-forest-400 ml-0.5 tracking-tight">Digital</span>
        </div>
      )}
    </div>
  );
}

export default Logo;
