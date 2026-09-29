'use client';

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Wait for exit animation
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible && !onClose) return null;

  const bgColors = {
    success: 'bg-eco-600/90 border-eco-500',
    error: 'bg-red-600/90 border-red-500',
    info: 'bg-blue-600/90 border-blue-500',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`backdrop-blur-md border rounded-xl shadow-lg shadow-black/20 p-4 flex items-center space-x-3 min-w-[250px] ${bgColors[type]}`}>
        <span className="text-xl">{icons[type]}</span>
        <p className="text-white font-medium flex-1">{message}</p>
        <button onClick={() => setVisible(false)} className="text-white/70 hover:text-white transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}
