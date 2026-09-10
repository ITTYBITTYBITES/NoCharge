import { describe, expect, test } from 'vitest';

import {
  SITE_MODE_KEY,
  createSiteModeController,
  isSiteMode,
  parseSiteMode,
  readSiteMode,
  siteModeBootstrapScript,
  writeSiteMode,
} from './mode-toggle';

/** Minimal in-memory stand-in for `Storage`. */
function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    get size() {
      return map.size;
    },
    dump: () => Object.fromEntries(map),
  } as unknown as Storage & { dump: () => Record<string, string> };
}

function fakeRoot() {
  return { dataset: {} as Record<string, string> } as unknown as HTMLElement;
}

function fakeDoc() {
  const handlers: ((event: unknown) => void)[] = [];
  return {
    addEventListener: (_type: string, handler: (event: unknown) => void) => handlers.push(handler),
    removeEventListener: (_type: string, handler: (event: unknown) => void) => {
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    },
    handlers,
  } as unknown as Document & { handlers: ((event: unknown) => void)[] };
}

describe('site mode preference', () => {
  test('the key is namespaced under the shared NoCharge prefix', () => {
    expect(SITE_MODE_KEY).toBe('nocharge:pref:site-mode');
  });

  test('an absent or malformed value falls back to calm', () => {
    expect(parseSiteMode(null)).toBe('calm');
    expect(parseSiteMode('not json')).toBe('calm');
    expect(parseSiteMode('"arcade"')).toBe('calm');
    expect(parseSiteMode('"lab"')).toBe('lab');
    expect(parseSiteMode('"calm"')).toBe('calm');
    expect(isSiteMode('lab')).toBe(true);
    expect(isSiteMode('LOUD')).toBe(false);
  });

  test('a visitor with no stored preference gets the calm site', () => {
    expect(readSiteMode(memoryStorage())).toBe('calm');
    expect(readSiteMode(null)).toBe('calm');
  });

  test('a storage that throws still resolves to calm', () => {
    const hostile = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readSiteMode(hostile)).toBe('calm');
    expect(writeSiteMode(hostile, 'lab')).toBe('calm');
  });

  test('a localStorage global that throws on property access is survived', () => {
    // A browser blocking storage can throw a SecurityError merely on *touching*
    // the property, and `typeof` on a throwing accessor still throws. This is
    // the state /my-arcade/ shows an explanatory panel for; an uncaught error
    // from resolving storage would break that page entirely.
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get(): Storage {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });

    try {
      const root = fakeRoot();
      const controller = createSiteModeController({ root, document: fakeDoc() });

      // No throw, and the safe default.
      expect(controller.get()).toBe('calm');
      expect(root.dataset.sitePreference).toBe('calm');

      // The choice still applies for this session even though it cannot be kept.
      expect(controller.set('lab')).toBe('lab');
      expect(root.dataset.sitePreference).toBe('lab');
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  test('write then read round-trips, and is reflected on the root element', () => {
    const storage = memoryStorage();
    const root = fakeRoot();
    const controller = createSiteModeController({ storage, root, document: fakeDoc() });

    expect(controller.get()).toBe('calm');
    expect(root.dataset.sitePreference).toBe('calm');

    controller.set('lab');
    expect(controller.get()).toBe('lab');
    expect(root.dataset.sitePreference).toBe('lab');
    expect(JSON.parse(storage.getItem(SITE_MODE_KEY)!)).toBe('lab');
  });

  test('clicking a mode option persists before the browser navigates', () => {
    const storage = memoryStorage();
    const root = fakeRoot();
    const doc = fakeDoc();
    createSiteModeController({ storage, root, document: doc });

    const option = { dataset: { modeOption: 'lab' } } as unknown as HTMLElement;
    const handler = doc.handlers[0];
    handler({ target: { closest: () => option } });

    // Written synchronously, so the next document paints with Lab already
    // revealed and there is no flash of the calm-only nav.
    expect(JSON.parse(storage.getItem(SITE_MODE_KEY)!)).toBe('lab');
    expect(root.dataset.sitePreference).toBe('lab');
  });

  test('a click on unrelated markup is ignored', () => {
    const storage = memoryStorage();
    const doc = fakeDoc();
    createSiteModeController({ storage, root: fakeRoot(), document: doc });

    doc.handlers[0]({ target: { closest: () => null } });
    expect(storage.getItem(SITE_MODE_KEY)).toBeNull();
  });

  test('destroy removes the listener', () => {
    const doc = fakeDoc();
    const controller = createSiteModeController({ storage: memoryStorage(), root: fakeRoot(), document: doc });
    expect(doc.handlers).toHaveLength(1);
    controller.destroy();
    expect(doc.handlers).toHaveLength(0);
  });
});

describe('bootstrap script', () => {
  test('runs against a document-like global without throwing', () => {
    const dataset: Record<string, string> = {};
    const store: Record<string, string> = {};
    const sandbox = {
      localStorage: { getItem: (key: string) => store[key] ?? null },
      document: { documentElement: { dataset } },
    };

    // eslint-disable-next-line no-new-func
    new Function('localStorage', 'document', siteModeBootstrapScript())(
      sandbox.localStorage,
      sandbox.document,
    );
    expect(sandbox.document.documentElement.dataset.sitePreference).toBe('calm');
  });

  test('reads a stored lab preference', () => {
    const dataset: Record<string, string> = {};
    const sandbox = {
      localStorage: { getItem: () => '"lab"' },
      document: { documentElement: { dataset } },
    };
    // eslint-disable-next-line no-new-func
    new Function('localStorage', 'document', siteModeBootstrapScript())(
      sandbox.localStorage,
      sandbox.document,
    );
    expect(dataset.sitePreference).toBe('lab');
  });

  test('is small enough to sit in the critical path', () => {
    // The bootstrap is blocking. If it grows past a couple of hundred bytes it
    // belongs in the bundle, not in <head>.
    expect(siteModeBootstrapScript().length).toBeLessThan(400);
  });
});
