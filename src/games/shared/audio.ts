/** Shared procedural audio facade. Audio is independent from prefers-reduced-motion: reduced motion affects animation, not a user's separate sound preference. */
export * from './audio/play';
export * from './audio/sound-bank';
export { startAmbient, stopAmbient, refreshAmbient, getAmbient, getActiveAmbient, duckAmbient } from './audio/ambient';
