/**
 * Shared Quiet Setup topic vocabulary and count formatting.
 *
 * The published Setup index previously summed *every* topic tag on every
 * article (`topics: [...]`), which reported 4 + 3 + 3 + 7 + 2 = 19 "launch
 * guides in the feed" across a section that only contains eight articles.
 * Readers could reasonably read "4 launch guides in the feed" under
 * "Keyboards" as four dedicated keyboard guides, so the index now counts each
 * article once, under its single primary `topic`, and labels the number
 * plainly as guides.
 */
export const SETUP_TOPIC_IDS = [
  'keyboards',
  'pointing-devices',
  'screens-and-stands',
  'desk-and-comfort',
  'offline-puzzles',
  'audio',
  'lighting',
] as const;

export type SetupTopicId = (typeof SETUP_TOPIC_IDS)[number];

export const SETUP_TOPIC_LABELS: Record<SetupTopicId, string> = {
  keyboards: 'Keyboards',
  'pointing-devices': 'Pointing devices',
  'screens-and-stands': 'Screens and stands',
  'desk-and-comfort': 'Desk and comfort',
  'offline-puzzles': 'Offline puzzles',
  audio: 'Audio',
  lighting: 'Lighting',
};

export const SETUP_TOPIC_DESCRIPTIONS: Record<SetupTopicId, string> = {
  keyboards: 'Layouts, key feel, and sound sources.',
  'pointing-devices': 'Mouse, trackpad, trackball, and touch tradeoffs.',
  'screens-and-stands': 'Zoom, orientation, stability, and screen placement.',
  'desk-and-comfort': 'Practical, low-noise choices without guarantees.',
  'offline-puzzles': 'Paper formats, progression, print, and answer keys.',
  audio: 'Headphones, speakers, and quiet-listening tradeoffs.',
  lighting: 'Color temperature, bias lighting, and evening comfort.',
};

/** Count published articles by their single primary topic. */
export function countByPrimaryTopic(
  articles: readonly { topic: string; draft?: boolean }[],
): Record<SetupTopicId, number> {
  const counts = Object.fromEntries(SETUP_TOPIC_IDS.map((id) => [id, 0])) as Record<SetupTopicId, number>;
  for (const article of articles) {
    if (article.draft) continue;
    if ((SETUP_TOPIC_IDS as readonly string[]).includes(article.topic)) counts[article.topic as SetupTopicId] += 1;
  }
  return counts;
}

/** "1 guide" / "2 guides" — never "4 launch guides in the feed" for a tag total. */
export function formatGuideCount(count: number): string {
  return `${count} ${count === 1 ? 'guide' : 'guides'}`;
}
