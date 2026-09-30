'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Render into <body> instead of in place. Many pages wrap their content in
  // `animate-fade-in`, and that animation leaves a transform on the ancestor,
  // which makes it the containing block for `position: fixed`. The sheet then
  // anchored to the wrong box and opened half off-screen, with its first
  // controls unreachable at a negative y.
  //
  // `.sheet-scrim` and `.sheet-panel` put the scrim and the panel back inside
  // the 720px device column on wide screens, so escaping the frame does not
  // make them span the whole desktop window.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="sheet-scrim bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={[
          'sheet-panel rounded-t-3xl bg-white dark:bg-stone-900 shadow-xl',
          'flex flex-col h-[90vh] max-h-[90vh] transition-transform duration-300',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors dark:text-stone-500"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-safe">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

export default BottomSheet;
