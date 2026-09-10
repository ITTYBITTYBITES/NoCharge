/**
 * Stateful site-mode preference (calm ⇄ lab).
 *
 * The design goal is that the calm Quiet Arcade is never diluted for a visitor
 * who did not ask for the Lab. So the stored preference does not merely
 * remember a highlight — it is what makes the Lab reachable at all:
 *
 *  - preference `calm` (default): the Lab is absent from the primary nav.
 *  - preference `lab`: the Lab link is present, everywhere, every session.
 *
 * Two document attributes carry different information and must not be conflated:
 *
 *  - `data-site-mode` is set **server-side by the route** and says which
 *    section the current page belongs to. Setting this from storage would
 *    require a blocking read before first paint or cause a flash.
 *  - `data-site-preference` is set from `localStorage` and says what the
 *    visitor chose. Only this one is written by this module.
 */

import { prefKey } from '../../games/shared/storage';

export type SiteMode = 'calm' | 'lab';

/** Storage key. Resolves to `nocharge:pref:site-mode` via the shared prefix. */
export const SITE_MODE_KEY = prefKey('site-mode');

export function isSiteMode(value: unknown): value is SiteMode {
  return value === 'calm' || value === 'lab';
}

/** Parse a stored value. Anything missing or malformed reads back as `calm`. */
export function parseSiteMode(raw: string | null): SiteMode {
  if (raw == null) return 'calm';
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSiteMode(parsed) ? parsed : 'calm';
  } catch {
    return 'calm';
  }
}

export function readSiteMode(storage: Storage | null | undefined): SiteMode {
  if (!storage) return 'calm';
  try {
    return parseSiteMode(storage.getItem(SITE_MODE_KEY));
  } catch {
    // Private mode, disabled storage, or a security error. The calm default is
    // the safe failure mode: a visitor who cannot be remembered should get the
    // calm site, not an unexpected section.
    return 'calm';
  }
}

/**
 * Persist the preference. Returns the mode that is durably stored, which is
 * `calm` whenever the write did not take.
 *
 * Returning the *stored* value rather than the requested one is deliberate: a
 * caller that cares about durability can trust this result. Callers that want
 * "what the visitor just chose" should keep their own copy — which is why
 * `createSiteModeController` tracks `current` separately and still applies the
 * choice to the DOM for this session even when storage refuses it.
 */
export function writeSiteMode(storage: Storage | null | undefined, mode: SiteMode): SiteMode {
  if (!storage || !isSiteMode(mode)) return readSiteMode(storage);
  try {
    storage.setItem(SITE_MODE_KEY, JSON.stringify(mode));
  } catch {
    /* Quota or private mode: nothing was stored, so report `calm`. */
    return 'calm';
  }
  return mode;
}

/** Reflect the preference on the document so CSS can react without JS per page. */
export function applySiteMode(root: HTMLElement, mode: SiteMode): void {
  root.dataset.sitePreference = mode;
}

export interface SiteModeControllerOptions {
  storage?: Storage | null;
  root?: HTMLElement;
  document?: Document;
}

export interface SiteModeController {
  get(): SiteMode;
  set(mode: SiteMode): SiteMode;
  destroy(): void;
}

/**
 * Wire the markup rendered by `ModeToggle.astro`.
 *
 * The control is two ordinary links, so it navigates with JavaScript disabled.
 * This controller only adds persistence: it records the choice before the
 * browser follows the link, so the destination renders with the right nav on
 * the very first paint.
 */
/**
 * Read the `localStorage` global without ever letting it throw.
 *
 * A browser that blocks storage does not merely fail on reads — in some
 * configurations **touching the property at all** throws a `SecurityError`, and
 * `typeof` on a throwing accessor still throws. So the reference has to be
 * resolved inside a `try`, not just the method call.
 *
 * `/my-arcade/` has a "blocked storage" state that must keep working with
 * storage denied, and an uncaught error here would take that page down with it.
 */
function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function createSiteModeController(options: SiteModeControllerOptions = {}): SiteModeController {
  const storage = options.storage ?? defaultStorage();
  const root = options.root ?? (typeof document === 'undefined' ? null : document.documentElement);
  const doc = options.document ?? (typeof document === 'undefined' ? null : document);

  let current = readSiteMode(storage);
  if (root) applySiteMode(root, current);

  const onClick = (event: MouseEvent) => {
    const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-mode-option]');
    if (!trigger) return;
    const mode = trigger.dataset.modeOption;
    if (!isSiteMode(mode)) return;
    // The choice applies to this session whether or not it can be stored, so a
    // visitor in private mode still sees the Lab appear.
    current = mode;
    if (root) applySiteMode(root, current);
    // Persist synchronously, before navigation. `writeSiteMode` uses
    // localStorage, which is synchronous, so the next document reads the new
    // value on its first paint. A failed write is ignored: the visitor still
    // gets the section they asked for, it just will not be remembered.
    writeSiteMode(storage, mode);
  };

  doc?.addEventListener('click', onClick);

  return {
    get: () => current,
    set(mode) {
      if (!isSiteMode(mode)) return current;
      current = mode;
      if (root) applySiteMode(root, current);
      writeSiteMode(storage, mode);
      return current;
    },
    destroy() {
      doc?.removeEventListener('click', onClick);
    },
  };
}

/**
 * Bootstrap script body for the document `<head>`.
 *
 * Runs blocking, before first paint, so the nav never renders the Lab link and
 * then yank it away. Kept to a few statements on purpose — this is in the
 * critical path of every page.
 */
export function siteModeBootstrapScript(): string {
  return `(function(){try{var k=${JSON.stringify(SITE_MODE_KEY)};var v=localStorage.getItem(k);var m=v?(JSON.parse(v)==='lab'?'lab':'calm'):'calm';document.documentElement.dataset.sitePreference=m;}catch(e){document.documentElement.dataset.sitePreference='calm';}})();`;
}
