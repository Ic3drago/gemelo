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

const configs: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-forest-600',
    icon: <CheckCircle2 className="h-5 w-5 text-white" />,
  },
  error: {
    bg: 'bg-rose-600',
    icon: <XCircle className="h-5 w-5 text-white" />,
  },
  info: {
    bg: 'bg-sky-600',
    icon: <Info className="h-5 w-5 text-white" />,
  },
  warning: {
    bg: 'bg-amber-500',
    icon: <AlertTriangle className="h-5 w-5 text-white" />,
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
