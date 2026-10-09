import { describe, expect, it, vi } from 'vitest';

// Simulate a Turkish dictionary that is missing a key. The lookup must fall back
// to English rather than showing the raw key or an empty string.
vi.mock('./dictionaries/tr.json', () => ({ default: { 'game.pause': 'Duraklat' } }));

const { t } = await import('./messages');

describe('missing-key English fallback', () => {
  it('uses the Turkish text when the locale has the key', () => {
    expect(t('tr', 'game.pause')).toBe('Duraklat');
  });

  it('falls back to English when the locale lacks the key', () => {
    expect(t('tr', 'nav.arcade')).toBe('Arcade');
    expect(t('tr', 'game.play', { title: 'Hangman' })).toBe('Play Hangman');
  });

  it('falls back to the key only when English lacks it too', () => {
    expect(t('tr', 'missing.everywhere' as never)).toBe('missing.everywhere');
  });
});
