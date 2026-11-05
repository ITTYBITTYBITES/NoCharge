/**
 * Setup topic → approved Awin merchant keys.
 *
 * The key set is typed against the schema's real topics (not artwork names, not
 * article slugs), so a typo is a compile error instead of a silently empty
 * block. That mistake shipped once: the first version of this map used artwork
 * identifiers (`lamp`, `bias-light`, …) and produced **zero** affiliate blocks
 * across all 210 Setup articles while every validator passed.
 *
 * Rules:
 *  - A merchant appears only where it is editorially relevant. A lamp article
 *    must never show a monitor arm.
 *  - An empty array is a deliberate "nothing fits here yet", not an oversight.
 *  - Every key must be a merchant key from `src/config/awin.ts`.
 */

/** The seven topics the content schema allows. Kept in sync by test. */
export const SETUP_TOPICS = [
  'keyboards',
  'pointing-devices',
  'screens-and-stands',
  'desk-and-comfort',
  'offline-puzzles',
  'audio',
  'lighting',
] as const;

export type SetupTopic = (typeof SETUP_TOPICS)[number];

export const AWIN_MERCHANTS_BY_TOPIC: Record<SetupTopic, readonly string[]> = {
  // No approved merchant sells keyboards or pointing devices.
  keyboards: [],
  'pointing-devices': [],
  // Monitor arms, risers, clamps and cable accessories.
  'screens-and-stands': ['shenzhen-cangyu'],
  // Desk accessories: routing, risers, small peripherals.
  'desk-and-comfort': ['shenzhen-cangyu'],
  // Offline puzzle books and paper goods: not on Awin.
  'offline-puzzles': [],
  // Headphones and speakers: not on Awin.
  audio: [],
  // LED hobby lighting is the one brkox fit.
  lighting: ['brkox'],
};

/**
 * Guard for the failure mode above: a topic that maps to a merchant but whose
 * merchant is not in the registry would render nothing, quietly.
 */
export function assertTopicMapMatchesRegistry(merchantKeys: readonly string[]): string[] {
  const problems: string[] = [];
  for (const [topic, keys] of Object.entries(AWIN_MERCHANTS_BY_TOPIC)) {
    for (const key of keys) {
      if (!merchantKeys.includes(key)) {
        problems.push(`topic "${topic}" maps to unknown merchant "${key}"`);
      }
    }
  }
  return problems;
}
