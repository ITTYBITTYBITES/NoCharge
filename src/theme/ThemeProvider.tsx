import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'nocharge-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function parsePreference(value: string | null | undefined): ThemePreference | null {
  return value === 'system' || value === 'light' || value === 'dark' ? value : null;
}

function readStoredPreference(): ThemePreference | null {
  try {
    return parsePreference(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be disabled by browser privacy settings; theme still works in-memory.
    return null;
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function applyPreference(preference: ThemePreference): void {
  const root = document.documentElement;
  const resolved = preference === 'system'
    ? (systemPrefersDark() ? 'dark' : 'light')
    : preference;

  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    'content',
    resolved === 'dark' ? '#121212' : '#f7f6ef',
  );
}

export function ThemeProvider({ children }: PropsWithChildren) {
  // A stable server/client first render prevents hydration differences. The head
  // bootstrap has already applied the persisted or system-resolved palette.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyPreference(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the selection active for this page view when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const initial = readStoredPreference() ?? parsePreference(root.dataset.themePreference) ?? 'system';
    startTransition(() => setPreferenceState(initial));
    applyPreference(initial);

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (root.dataset.themePreference === 'system') applyPreference('system');
    };
    if (media?.addEventListener) media.addEventListener('change', onSystemChange);
    else media?.addListener?.(onSystemChange);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = event.key === STORAGE_KEY
        ? parsePreference(event.newValue) ?? 'system'
        : readStoredPreference() ?? 'system';
      startTransition(() => setPreferenceState(next));
      applyPreference(next);
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (media?.removeEventListener) media.removeEventListener('change', onSystemChange);
      else media?.removeListener?.(onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.');
  return context;
}
