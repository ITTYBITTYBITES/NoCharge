import { describe, expect, it } from 'vitest';
import { CLEARABLE_GAME_DATA_KEYS } from './local-game-data';
import { STORAGE_KEY_DOCS, validateStorageDocs } from './storage-docs';

describe('storage documentation', () => {
  it('documents every clearable NoCharge key', () => {
    expect(validateStorageDocs(CLEARABLE_GAME_DATA_KEYS)).toEqual([]);
  });

  it('uses unique keys', () => {
    const keys = STORAGE_KEY_DOCS.map((doc) => doc.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('documents the daily hub keys as planned', () => {
    const daily = STORAGE_KEY_DOCS.filter((doc) => doc.category === 'hub');
    expect(daily.length).toBeGreaterThanOrEqual(4);
  });
});
