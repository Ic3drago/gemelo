'use client';

import { useCallback, useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  nextThemePreference,
  readStoredTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme';

const options = {
  system: { label: 'Automático', Icon: Monitor },
  light: { label: 'Claro', Icon: Sun },
  dark: { label: 'Oscuro', Icon: Moon },
} as const;

interface ThemeToggleProps {
  className?: string;
  iconOnly?: boolean;
}

export function ThemeToggle({ className = '', iconOnly = false }: ThemeToggleProps) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreference(readStoredTheme());
    setMounted(true);
  }, []);

  // Keep "system" in sync when the OS switches appearance while the app is open.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readStoredTheme() === 'system') {
        document.documentElement.classList.toggle('dark', media.matches);
        document.documentElement.style.colorScheme = media.matches ? 'dark' : 'light';
      }
    };
    media.addEventListener('change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      media.removeEventListener('change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const cycle = useCallback(() => {
    setPreference((current) => {
      const next = nextThemePreference(current);
      storeTheme(next);
      return next;
    });
  }, []);

  // Before mount the real preference is unknown, so render a neutral placeholder
  // to keep the label/icon from flipping on hydration.
  const key = mounted ? preference : ('system' as ThemePreference);
  const { label, Icon } = options[key];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tema: ${label}. Cambiar a ${options[nextThemePreference(key)].label.toLowerCase()}`}
      title={`Tema: ${label}`}
      data-theme-toggle=""
      data-testid="theme-toggle"
      data-preference={key}
      className={[
        'inline-flex items-center gap-2 rounded-xl font-medium transition-colors',
        'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
        iconOnly ? 'h-11 w-11 justify-center' : 'h-11 px-3 text-sm',
        className,
      ].join(' ')}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}

export { THEME_STORAGE_KEY };
export default ThemeToggle;
