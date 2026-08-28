import { loadPref, savePref } from '../storage';

/**
 * The ambient catalogue is intentionally data-first. The mixer, game toolbar,
 * preference validator, and documentation can all describe the same set of
 * procedural soundscapes without growing separate lists.
 */
export const AMBIENT_CATALOG = [
  {
    id: 'meadow-morning',
    label: 'Meadow morning',
    description: 'A gentle dawn: soft breeze, slow warm drone pads, and occasional bird song.',
    source: 'Filtered noise voices plus generated pad chords and moving tones',
    shaping: 'Long chord swells, slow wind drift, and spaced melodic phrases',
    character: 'Open, airy countryside morning',
  },
  {
    id: 'mountain-stream',
    label: 'Mountain stream',
    description: 'A calm brook of layered flowing water with slow swell and a distant bird.',
    source: 'Independently filtered noise voices plus generated tones',
    shaping: 'Banded water voices with slow gain and filter drift',
    character: 'Clear, steady flowing stream',
  },
  {
    id: 'zen-garden',
    label: 'Zen garden',
    description: 'Slow struck meditation tones over soft wind with long, patient decay.',
    source: 'Generated sine/triangle chimes and a filtered noise breeze',
    shaping: 'Pentatonic strikes with many-second envelopes and sparse timing',
    character: 'Still, meditative garden air',
  },
  {
    id: 'ocean-shore',
    label: 'Ocean shore',
    description: 'Wide, slow waves rolling in with body wash and crest foam, plus a calm low drone.',
    source: 'Generated noise wave pairs plus a sustained low pad tone',
    shaping: 'Eight-to-sixteen-second randomized wave envelopes',
    character: 'Peaceful, unhurried sea shore',
  },
  {
    id: 'pine-forest',
    label: 'Pine forest',
    description: 'Soft wind moving through trees with a warm pad and a distant woodpecker.',
    source: 'Filtered noise voices plus generated drone tones and transients',
    shaping: 'Slow random wind swells and rare, distant knocks',
    character: 'Deep, quiet conifer woodland',
  },
  {
    id: 'summer-night',
    label: 'Summer night',
    description: 'A quiet night floor with crickets, a distant owl, and a gentle moonlit pad.',
    source: 'Generated oscillators, soft pulses, noise floor, and drone tones',
    shaping: 'Long irregular chorus periods and rare low phrases',
    character: 'Warm, calm nocturnal meadow',
  },
  {
    id: 'floating-pads',
    label: 'Floating pads',
    description: 'Pure calm music: soft synthesizer chords that slowly drift between keys.',
    source: 'Generated triangle and sine oscillators only',
    shaping: 'Long attack and release, slow chord changes, and gentle detune',
    character: 'Weightless, unhurried ambient music',
  },
  {
    id: 'kalimba-lullaby',
    label: 'Kalimba lullaby',
    description: 'A gentle music-box-style kalimba playing slow pentatonic phrases with a soft pad.',
    source: 'Generated plucked triangle tones and sustained pad chords',
    shaping: 'Short pluck envelopes, sparse melodic timing, and long pad decay',
    character: 'Tender, sleepy lullaby texture',
  },
  {
    id: 'singing-bowls',
    label: 'Singing bowls',
    description: 'Sustained meditation bowl tones with beating harmonics and airy shimmer.',
    source: 'Generated sine oscillators with slight detune plus soft noise air',
    shaping: 'Very long envelopes and slowly shifting harmonic layers',
    character: 'Deep, resonant meditative stillness',
  },
  {
    id: 'music-box-drift',
    label: 'Music box drift',
    description: 'Delicate music-box notes floating over slow chords and a faint airy bed.',
    source: 'Generated bell tones, pad chords, and quiet filtered noise',
    shaping: 'Random gentle melodies, long reverb-like tails, and slow tempo',
    character: 'Dreamy, nostalgic drift',
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
  // Retired environmental soundscapes map to the closest new soundscape.
  rain: 'meadow-morning',
  rainfall: 'mountain-stream',
  forest: 'pine-forest',
  fireplace: 'zen-garden',
  ocean: 'ocean-shore',
  night: 'summer-night',
  'room-murmur': 'floating-pads',
  library: 'music-box-drift',
  lofi: 'kalimba-lullaby',
  'white-noise': 'floating-pads',
  'pink-noise': 'floating-pads',
  'brown-noise': 'ocean-shore',
  cafe: 'floating-pads',
  drone: 'floating-pads',
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
