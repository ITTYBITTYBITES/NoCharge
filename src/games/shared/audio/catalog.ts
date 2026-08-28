import { loadPref, savePref } from '../storage';

/**
 * The ambient catalogue is intentionally data-first. The mixer, game toolbar,
 * preference validator, and documentation can all describe the same set of
 * procedural soundscapes without growing separate lists.
 */
export const AMBIENT_CATALOG = [
  {
    id: 'white-noise',
    label: 'White noise',
    description: 'Continuous stereo white noise with no musical pitch.',
    source: 'Independent stereo white-noise generator',
    shaping: 'No tonal filter; conservative safety gain',
    character: 'Even, broad masking texture',
  },
  {
    id: 'pink-noise',
    label: 'Pink noise',
    description: 'Continuous stereo pink noise with a gently falling spectrum.',
    source: 'Independent stereo pink-noise generator',
    shaping: 'Documented multi-pole pink filter',
    character: 'Softer, warmer masking texture',
  },
  {
    id: 'brown-noise',
    label: 'Brown noise',
    description: 'Continuous stereo brown noise with DC protection and a high-pass floor.',
    source: 'Independent stereo brown-noise generator',
    shaping: 'Leaky integrator, high-pass, and low-pass protection',
    character: 'Deep, restrained low-frequency wash',
  },
  {
    id: 'rainfall',
    label: 'Rain',
    description: 'Procedural rain with a pink bed, roof texture, droplets, and changing clusters.',
    source: 'Pink and white noise voices plus generated transients',
    shaping: 'Independent filters, envelopes, and stereo positions',
    character: 'Layered rain-like soundscape',
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Procedural wind, leaf movement, and rare nonverbal bird phrases.',
    source: 'Filtered noise voices plus generated moving tones',
    shaping: 'Slow random density, brightness, and distance changes',
    character: 'Open, varied woodland atmosphere',
  },
  {
    id: 'fireplace',
    label: 'Fireplace',
    description: 'Procedural flame noise, irregular crackle groups, and sparse pops.',
    source: 'Brown and pink noise voices plus generated crackles',
    shaping: 'Power-law event amplitudes and changing resonances',
    character: 'Low, warm fire-like texture',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Four independent overlapping wave voices with water body and crest foam.',
    source: 'Eight continuously generated noise voices in four wave pairs',
    shaping: 'Six-to-fourteen-second randomized wave envelopes',
    character: 'Wide, slow sea-like movement',
  },
  {
    id: 'night',
    label: 'Night',
    description: 'A quiet floor and independent insects with long, irregular chorus periods.',
    source: 'Generated oscillators, noise pulses, and environmental noise',
    shaping: 'Different carriers, pulse shapes, rates, density, and stereo distance',
    character: 'Sparse nocturnal chorus',
  },
  {
    id: 'room-murmur',
    label: 'Soft room murmur',
    description: 'Neutral filtered room movement with no intelligible words or speech synthesis.',
    source: 'Low room tone and independent formant-filtered noise voices',
    shaping: 'Random density, gentle stereo movement, and sparse objects',
    character: 'Soft, nonverbal indoor atmosphere',
  },
  {
    id: 'library',
    label: 'Library',
    description: 'Extremely quiet ventilation, rare multi-stroke page turns, and material creaks.',
    source: 'Low noise voices plus generated page and material transients',
    shaping: 'Long randomized quiet periods and distant stereo placement',
    character: 'Still, low-level reading-room texture',
  },
  {
    id: 'lofi',
    label: 'Lofi — Quiet Arcade',
    description: 'A fully generated chord progression with bass, restrained drums, swing, and tape drift.',
    source: 'Oscillators, generated noise bursts, and a continuous noise floor',
    shaping: 'Bars, four-chord phrases, eight-bar changes, and smooth envelopes',
    character: 'Quiet procedural composition, not an audio loop',
  },
] as const;

export type AmbientCatalogEntry = (typeof AMBIENT_CATALOG)[number];
export type CurrentAmbientName = AmbientCatalogEntry['id'];

export const AMBIENT_NAMES = ['none', ...AMBIENT_CATALOG.map(({ id }) => id)] as [
  'none',
  ...CurrentAmbientName[],
];

export type AmbientName = (typeof AMBIENT_NAMES)[number];

/** Legacy values are read only so an existing saved choice is not discarded. */
const LEGACY_AMBIENT_ALIASES: Readonly<Record<string, AmbientName>> = {
  cafe: 'room-murmur',
  drone: 'none',
};

export function isAmbientName(value: unknown): value is AmbientName {
  return typeof value === 'string' && (AMBIENT_NAMES as readonly string[]).includes(value);
}

/** Validate and migrate a stored value without widening the playable catalogue. */
export function normalizeAmbientName(value: unknown): AmbientName {
  if (isAmbientName(value)) return value;
  if (typeof value === 'string' && value in LEGACY_AMBIENT_ALIASES) return LEGACY_AMBIENT_ALIASES[value]!;
  return 'none';
}

/** The local-data key remains `nocharge:pref:ambient-sound` for compatibility. */
export function readAmbientPreference(): AmbientName {
  const raw = loadPref<unknown>('ambient-sound', 'none');
  const normalized = normalizeAmbientName(raw);
  if (raw !== normalized) savePref('ambient-sound', normalized);
  return normalized;
}

export function writeAmbientPreference(name: AmbientName): void {
  savePref('ambient-sound', normalizeAmbientName(name));
}

export function getAmbientCatalogEntry(name: AmbientName): AmbientCatalogEntry | undefined {
  return AMBIENT_CATALOG.find((entry) => entry.id === name);
}
