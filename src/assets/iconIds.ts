/** Semantic IDs for explicitly approved AdaptiveIcon assets. File paths never enter content records. */
export const ASSET_ICON_IDS = [
  'daily-puzzle',
  'memory-category',
  'word-game-category',
  'tile-puzzle-category',
  'logic-puzzle-category',
  'card-games-category',
  'board-game-category',
  'pass-and-play-category',
  'guides-section',
  'tools-section',
  'discovery-wheel-tool',
  'game-finder-tool',
  'session-planner-tool',
  'random-activity-tool',
  'ambient-mixer-tool',
  'singing-bowl-tool',
  'reduced-motion-tool',
  'touch-target-tool',
  'storage-inspector-tool',
  'zoom-visualizer-tool',
] as const;

export type AssetIconId = (typeof ASSET_ICON_IDS)[number];

export function isAssetIconId(value: unknown): value is AssetIconId {
  return typeof value === 'string' && (ASSET_ICON_IDS as readonly string[]).includes(value);
}
