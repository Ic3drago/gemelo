export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'gemelo-theme';

/**
 * Inlined in <head> before paint so the `dark` class is already on <html>
 * when the first frame renders. Without this the page paints in light mode
 * and then flips, which is the "white text on a white card" flash.
 *
 * Kept as a string because it must run before any bundle is parsed.
 */
export const themeNoFlashScript = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var s=localStorage.getItem(k);
var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark',d);
document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function storeTheme(preference: ThemePreference) {
  try {
    if (preference === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* storage unavailable (private mode): the choice just won't persist */
  }
  applyTheme(resolveTheme(preference));
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
}
