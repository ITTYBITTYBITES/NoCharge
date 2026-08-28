import { loadPref, savePref } from '../storage';

export const SOUND_ENABLED = 'sound-enabled';
export const SOUND_VOLUME = 'sound-volume';
export const MASTER_MUTE = 'game-muted';

export function isMuted(): boolean {
  return loadPref(MASTER_MUTE, false);
}

export function writeMutedPreference(value: boolean, persist = true): void {
  if (persist) savePref(MASTER_MUTE, value);
}

export function isSoundEnabled(): boolean {
  return loadPref(SOUND_ENABLED, true);
}

export function writeSoundEnabledPreference(value: boolean): void {
  savePref(SOUND_ENABLED, value);
}

export function getSoundVolume(): number {
  const value = loadPref(SOUND_VOLUME, 60);
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 60;
}

export function writeSoundVolume(value: number): void {
  savePref(SOUND_VOLUME, Math.max(0, Math.min(100, Math.round(value))));
}
