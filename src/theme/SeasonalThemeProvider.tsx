import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  findHolidayEvent,
  holidayCalendar,
  resolveSeasonalSelection,
} from './holidayCalendar';
import type { HolidayEvent, SeasonalPreference } from './holidayCalendar';

const STORAGE_KEY = 'nocharge-seasonal-mode';

type SeasonalThemeContextValue = Readonly<{
  preference: SeasonalPreference;
  activeEvent: HolidayEvent | null;
  isPreview: boolean;
  setPreference: (preference: SeasonalPreference) => void;
}>;

type SeasonalState = Readonly<{
  preference: SeasonalPreference;
  activeEvent: HolidayEvent | null;
  isPreview: boolean;
}>;

const INITIAL_STATE: SeasonalState = {
  preference: 'auto',
  activeEvent: null,
  isPreview: false,
};

const SeasonalThemeContext = createContext<SeasonalThemeContextValue | null>(null);

function parsePreference(value: string | null | undefined): SeasonalPreference | null {
  return value === 'auto' || value === 'standard' ? value : null;
}

function readStoredPreference(): SeasonalPreference | null {
  try {
    return parsePreference(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function readBootstrapPreference(): SeasonalPreference | null {
  return parsePreference(document.documentElement.dataset.eventPreference);
}

function getResolution(preference: SeasonalPreference): SeasonalState {
  const search = new URLSearchParams(window.location.search);
  const result = resolveSeasonalSelection({
    date: new Date(),
    preference,
    previewEvent: search.get('previewEvent'),
    previewDate: search.get('previewDate'),
  });
  return {
    preference: result.preference,
    activeEvent: result.event,
    isPreview: result.isPreview,
  };
}

function applyRootState(state: SeasonalState): void {
  const root = document.documentElement;
  root.dataset.eventPreference = state.preference;
  root.dataset.event = state.activeEvent?.id ?? 'none';
  if (state.isPreview) root.dataset.eventPreview = 'true';
  else delete root.dataset.eventPreview;
}

function readInitialState(): SeasonalState {
  const preference = readStoredPreference() ?? readBootstrapPreference() ?? 'auto';
  return getResolution(preference);
}

export function SeasonalThemeProvider({ children }: PropsWithChildren) {
  // Server rendering starts neutral (`data-event="none"`); the head bootstrap
  // resolves the client date before styles paint. This state hydrates identically.
  const [state, setState] = useState<SeasonalState>(INITIAL_STATE);

  const setPreference = useCallback((preference: SeasonalPreference) => {
    // Choosing Standard/Auto exits an explicit QA preview so the control always
    // has an immediate, predictable effect and does not persist the preview.
    const url = new URL(window.location.href);
    url.searchParams.delete('previewEvent');
    url.searchParams.delete('previewDate');
    window.history.replaceState(window.history.state, '', url);

    const next = getResolution(preference);
    setState(next);
    applyRootState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // The selection still applies for this page view if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const initial = readInitialState();
    startTransition(() => setState(initial));
    applyRootState(initial);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const preference = event.key === STORAGE_KEY
        ? parsePreference(event.newValue) ?? 'auto'
        : readStoredPreference() ?? 'auto';
      const next = getResolution(preference);
      startTransition(() => setState(next));
      applyRootState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<SeasonalThemeContextValue>(() => ({
    preference: state.preference,
    activeEvent: state.activeEvent ? findHolidayEvent(state.activeEvent.id, holidayCalendar) : null,
    isPreview: state.isPreview,
    setPreference,
  }), [state, setPreference]);

  return <SeasonalThemeContext.Provider value={value}>{children}</SeasonalThemeContext.Provider>;
}

export function useSeasonalTheme() {
  const context = useContext(SeasonalThemeContext);
  if (!context) throw new Error('useSeasonalTheme must be used inside SeasonalThemeProvider.');
  return context;
}
