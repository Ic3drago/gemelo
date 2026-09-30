'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

// The message is 14px semibold white, so each background has to clear 4.5:1
// (WCAG AA). The 500/600 shades only reached 2.1-4.1:1, hence the 700/800 steps.
const configs: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-brand-700',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  error: {
    bg: 'bg-rose-700',
    icon: <XCircle className="h-5 w-5" />,
  },
  info: {
    bg: 'bg-sky-700',
    icon: <Info className="h-5 w-5" />,
  },
  warning: {
    bg: 'bg-amber-700',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
};

export function Toast({ message, type = 'info', onClose, duration = 3500 }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const config = configs[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={[
        'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        'text-white min-w-[260px] max-w-xs transition-all duration-300',
        config.bg,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      ].join(' ')}
      role="alert"
    >
      <span className="shrink-0">{config.icon}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 300); }}
        className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default Toast;
