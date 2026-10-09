import { describe, expect, it } from 'vitest';
import en from './dictionaries/en.json';
import tr from './dictionaries/tr.json';
import frCa from './dictionaries/fr-ca.json';
import es from './dictionaries/es.json';
import de from './dictionaries/de.json';
import { DEFAULT_LOCALE, LOCALES, LOCALE_META, PREFIXED_LOCALES, localeFromSegment } from './config';
import { t, hasTranslation, type MessageKey } from './messages';
import { formatMessage, message } from './message';
import { normalizeRoute, splitLocale, withLocale } from './routes';
import { isBodyTranslated, isPinnedToEnglish, translatedLocalesFor } from './coverage';
import { detectPreferredLocale, readStoredLocale, storeLocale, LANGUAGE_PREFERENCE_KEY } from './client';
import { pagePattern } from './localized-routes';

const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionaries', () => {
  it('every locale defines exactly the English key set', () => {
    const english = Object.keys(en).sort();
    expect(Object.keys(tr).sort()).toEqual(english);
    expect(Object.keys(frCa).sort()).toEqual(english);
    expect(Object.keys(es).sort()).toEqual(english);
    expect(Object.keys(de).sort()).toEqual(english);
  });

  it('translations use the same placeholders as English', () => {
    for (const key of Object.keys(en)) {
      const expected = placeholders(en[key as keyof typeof en]);
      expect(placeholders(tr[key as keyof typeof tr]), `tr ${key}`).toEqual(expected);
      expect(placeholders(frCa[key as keyof typeof frCa]), `fr-ca ${key}`).toEqual(expected);
      expect(placeholders(es[key as keyof typeof es]), `es ${key}`).toEqual(expected);
      expect(placeholders(de[key as keyof typeof de]), `de ${key}`).toEqual(expected);
    }
  });

  it('no translation is empty', () => {
    for (const dictionary of [en, tr, frCa, es, de]) {
      for (const value of Object.values(dictionary)) expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('t()', () => {
  it('returns the English text for the default locale', () => {
    expect(t('en', 'nav.arcade')).toBe('Arcade');
  });

  it('translates into each locale', () => {
    expect(t('tr', 'nav.arcade')).toBe('Oyunlar');
    expect(t('fr-ca', 'nav.arcade')).toBe('Arcade');
    expect(t('fr-ca', 'nav.guides')).toBe('Guides');
    expect(t('es', 'nav.arcade')).toBe('Juegos');
    expect(t('es', 'site.skip')).toBe('Saltar al contenido principal');
    expect(t('de', 'nav.arcade')).toBe('Spiele');
    expect(t('de', 'site.skip')).toBe('Zum Hauptinhalt springen');
  });

  it('replaces named parameters', () => {
    expect(t('en', 'game.play', { title: 'Hangman' })).toBe('Play Hangman');
    expect(t('tr', 'game.play', { title: 'Hangman' })).toContain('Hangman');
  });

  it('leaves an unknown placeholder visible rather than blank', () => {
    expect(t('en', 'game.play')).toBe('Play {title}');
  });

  it('selects plural forms with Intl.PluralRules', () => {
    expect(t('en', 'common.moves', { count: 1 })).toBe('1 move');
    expect(t('en', 'common.moves', { count: 0 })).toBe('0 moves');
    expect(t('en', 'common.moves', { count: 12 })).toBe('12 moves');
    // French treats 0 as singular.
    expect(t('fr-ca', 'common.moves', { count: 0 })).toBe('0 coup');
    expect(t('fr-ca', 'common.moves', { count: 2 })).toBe('2 coups');
    // Spanish and German use one/other like English.
    expect(t('es', 'common.moves', { count: 1 })).toBe('1 movimiento');
    expect(t('es', 'common.moves', { count: 2 })).toBe('2 movimientos');
    expect(t('de', 'common.moves', { count: 1 })).toBe('1 Zug');
    expect(t('de', 'common.moves', { count: 2 })).toBe('2 Züge');
  });

  it('returns the key itself when no dictionary has it', () => {
    expect(t('tr', 'does.not.exist' as MessageKey)).toBe('does.not.exist');
  });

  it('reports whether a locale has its own translation', () => {
    expect(hasTranslation('tr', 'nav.arcade')).toBe(true);
    expect(hasTranslation('en', 'nav.arcade')).toBe(true);
    expect(hasTranslation('tr', 'nope' as MessageKey)).toBe(false);
  });
});

describe('structured messages', () => {
  it('formats a message with a nested message parameter', () => {
    const value = message('beacon.selected', { name: message('beacon.type.cross') });
    expect(formatMessage('en', value)).toBe('Cross selected.');
    expect(formatMessage('tr', value)).toBe('Artı seçildi.');
    expect(formatMessage('es', value)).toBe('Cruz seleccionada.');
    expect(formatMessage('de', value)).toBe('Kreuz ausgewählt.');
  });

  it('formats a plain key without parameters', () => {
    expect(formatMessage('fr-ca', message('game.pause'))).toBe('Mettre le jeu en pause');
    expect(formatMessage('es', message('game.pause'))).toBe('Pausar el juego');
    expect(formatMessage('de', message('game.pause'))).toBe('Spiel pausieren');
  });

  it('formats numbers passed as parameters', () => {
    const value = message('beacon.statusSolved', { count: 4, par: 6 });
    expect(formatMessage('en', value)).toBe('Solved with 4 beacons. Par 6.');
  });
});

describe('routing', () => {
  it('normalizes a route to a leading and trailing slash', () => {
    expect(normalizeRoute('arcade')).toBe('/arcade/');
    expect(normalizeRoute('/arcade/')).toBe('/arcade/');
    expect(normalizeRoute('/sitemap.xml')).toBe('/sitemap.xml');
    expect(normalizeRoute('/')).toBe('/');
  });

  it('splits a localized pathname into locale and English route', () => {
    expect(splitLocale('/tr/arcade/')).toEqual({ locale: 'tr', route: '/arcade/' });
    expect(splitLocale('/fr-ca/')).toEqual({ locale: 'fr-ca', route: '/' });
    expect(splitLocale('/es/games/hangman/')).toEqual({ locale: 'es', route: '/games/hangman/' });
    expect(splitLocale('/de/')).toEqual({ locale: 'de', route: '/' });
    expect(splitLocale('/arcade/')).toEqual({ locale: 'en', route: '/arcade/' });
    expect(splitLocale('/')).toEqual({ locale: 'en', route: '/' });
  });

  it('does not treat an English page as a locale prefix', () => {
    expect(localeFromSegment('tr')).toBe('tr');
    expect(localeFromSegment('es')).toBe('es');
    expect(localeFromSegment('de')).toBe('de');
    expect(localeFromSegment('en')).toBeNull();
    expect(localeFromSegment('arcade')).toBeNull();
  });

  it('builds a localized URL from an English route', () => {
    expect(withLocale('/arcade/', 'tr')).toBe('/tr/arcade/');
    expect(withLocale('/', 'fr-ca')).toBe('/fr-ca/');
    expect(withLocale('/games/hangman/', 'es')).toBe('/es/games/hangman/');
    expect(withLocale('/', 'de')).toBe('/de/');
    expect(withLocale('/arcade/', 'en')).toBe('/arcade/');
  });

  it('keeps English at the root and prefixes only the other locales', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(LOCALES).toEqual(['en', 'tr', 'fr-ca', 'es', 'de']);
    expect(PREFIXED_LOCALES).toEqual(['tr', 'fr-ca', 'es', 'de']);
  });

  it('maps page files to mirrored route patterns', () => {
    expect(pagePattern('index.astro')).toBe('');
    expect(pagePattern('tools/index.astro')).toBe('tools');
    expect(pagePattern('arcade.astro')).toBe('arcade');
    expect(pagePattern('games/[slug].astro')).toBe('games/[slug]');
  });
});

describe('coverage', () => {
  it('English is always translated', () => {
    expect(isBodyTranslated('en', '/anything/')).toBe(true);
  });

  it('untranslated bodies are not advertised as alternates', () => {
    expect(isBodyTranslated('tr', '/arcade/')).toBe(false);
    expect(translatedLocalesFor('/arcade/')).toEqual([]);
  });

  it('pins word games to English in every other locale', () => {
    for (const game of ['hangman', 'word-loom', 'word-search', 'word-tile-rush']) {
      expect(isPinnedToEnglish('tr', game)).toBe(true);
      expect(isPinnedToEnglish('fr-ca', game)).toBe(true);
      expect(isPinnedToEnglish('es', game)).toBe(true);
      expect(isPinnedToEnglish('de', game)).toBe(true);
      expect(isPinnedToEnglish('en', game)).toBe(false);
    }
    expect(isPinnedToEnglish('tr', 'checkers')).toBe(false);
    expect(isPinnedToEnglish('es', 'checkers')).toBe(false);
  });

  it('gives every locale a meta record', () => {
    for (const locale of LOCALES) expect(LOCALE_META[locale].htmlLang).toBeTruthy();
    expect(LOCALE_META['fr-ca'].htmlLang).toBe('fr-CA');
    expect(LOCALE_META.es.htmlLang).toBe('es');
    expect(LOCALE_META.de.htmlLang).toBe('de');
  });
});

describe('language preference', () => {
  it('suggests a translated language from browser preferences only', () => {
    expect(detectPreferredLocale(['tr-TR', 'en'])).toBe('tr');
    expect(detectPreferredLocale(['fr-CA'])).toBe('fr-ca');
    expect(detectPreferredLocale(['fr'])).toBe('fr-ca');
    expect(detectPreferredLocale(['es-MX'])).toBe('es');
    expect(detectPreferredLocale(['es'])).toBe('es');
    expect(detectPreferredLocale(['de-AT'])).toBe('de');
    expect(detectPreferredLocale(['de'])).toBe('de');
    expect(detectPreferredLocale(['en-US', 'tr'])).toBeNull();
    expect(detectPreferredLocale(['ja-JP'])).toBeNull();
    expect(detectPreferredLocale([])).toBeNull();
  });

  it('stores the choice under the shared preference namespace', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    } as unknown as Storage;
    expect(LANGUAGE_PREFERENCE_KEY).toBe('nocharge:pref:language');
    expect(readStoredLocale(storage)).toBeNull();
    storeLocale('tr', storage);
    expect(readStoredLocale(storage)).toBe('tr');
  });

  it('ignores a stored value that is not a known locale', () => {
    const storage = {
      getItem: () => '"ja"',
      setItem: () => undefined,
    } as unknown as Storage;
    expect(readStoredLocale(storage)).toBeNull();
  });

  it('tolerates storage that throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readStoredLocale(storage)).toBeNull();
    expect(() => storeLocale('tr', storage)).not.toThrow();
  });
});
