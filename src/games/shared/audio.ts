/** Shared procedural audio facade. Soundscapes are independent from prefers-reduced-motion: reduced motion affects animation, not a user's separate sound preference. */
export * from './audio/play';
export * from './audio/sound-bank';
export {
  AMBIENT_CATALOG,
  AMBIENT_NAMES,
  AMBIENT_CROSSFADE_SECONDS,
  getAmbientCatalogEntry,
  startAmbient,
  stopAmbient,
  refreshAmbient,
  getAmbient,
  setAmbient,
  getActiveAmbient,
  isAmbientName,
  duckAmbient,
  updateAmbientVolume,
  suspendAmbientForVisibility,
  resumeAmbientAfterVisibility,
} from './audio/ambient';
export type { AmbientName, AmbientCatalogEntry } from './audio/ambient';
