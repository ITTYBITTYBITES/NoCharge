import dailyPuzzleSvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc01-r3-1-daily-puzzle-min.svg?raw';
import memoryCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc02-r3-1-memory-category-min.svg?raw';
import wordGameCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc03-r3-1-word-game-category-min.svg?raw';
import tilePuzzleCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc04-r3-1-tile-puzzle-category-min.svg?raw';
import logicPuzzleCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc05-r3-1-logic-puzzle-category-min.svg?raw';
import cardGamesCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc06-r3-1-card-games-category-min.svg?raw';
import boardGameCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc07-r3-1-board-game-category-min.svg?raw';
import passAndPlayCategorySvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc08-r3-1-pass-and-play-category-min.svg?raw';
import guidesSectionSvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc09-r3-1-guides-section-min.svg?raw';
import toolsSectionSvg from '../../assets/brand/nocharge/batch-01-r3.1/optimized/nc10-r3-1-tools-section-min.svg?raw';
import DiscoveryWheelToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc11-b02-r3-1-discovery-wheel-min.svg?raw';
import GameFinderToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc12-b02-r3-1-game-finder-min.svg?raw';
import SessionPlannerToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc13-b02-r3-1-session-planner-min.svg?raw';
import RandomActivityToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc14-b02-r3-1-random-activity-min.svg?raw';
import AmbientMixerToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc15-b02-r3-1-ambient-mixer-min.svg?raw';
import SingingBowlToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc16-b02-r3-1-singing-bowl-engine-min.svg?raw';
import ReducedMotionToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc17-b02-r3-1-reduced-motion-tester-min.svg?raw';
import TouchTargetToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc18-b02-r3-1-touch-target-checker-min.svg?raw';
import StorageInspectorToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc19-b02-r3-1-storage-inspector-min.svg?raw';
import ZoomVisualizerToolSvg from '../../assets/brand/nocharge/batch-02-r3.1/optimized/nc20-b02-r3-1-zoom-visualizer-min.svg?raw';
import { isAssetIconId } from './iconIds';
import type { AssetIconId } from './iconIds';

export interface AdaptiveSvgAsset {
  id: AssetIconId;
  manifestAssetId: string;
  sourcePath: string;
  optimizedPath: string;
  format: 'svg';
  width: 24;
  height: 24;
  svgMarkup: string;
}

const asset = (
  id: AssetIconId,
  manifestAssetId: string,
  sourcePath: string,
  optimizedPath: string,
  svgMarkup: string,
): AdaptiveSvgAsset => ({
  id,
  manifestAssetId,
  sourcePath,
  optimizedPath,
  format: 'svg',
  width: 24,
  height: 24,
  svgMarkup,
});

/**
 * The single runtime mapping from explicitly authorized semantic IDs to
 * optimized adaptive SVGs. Content and components store IDs only; asset paths
 * remain here. Rejected R1/R2 and pending R3 proposals are deliberately absent.
 */
export const approvedAssetIcons: Readonly<Record<AssetIconId, AdaptiveSvgAsset>> = {
  'daily-puzzle': asset(
    'daily-puzzle',
    'NC01-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc01-r3-1-daily-puzzle.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc01-r3-1-daily-puzzle-min.svg',
    dailyPuzzleSvg,
  ),
  'memory-category': asset(
    'memory-category',
    'NC02-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc02-r3-1-memory-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc02-r3-1-memory-category-min.svg',
    memoryCategorySvg,
  ),
  'word-game-category': asset(
    'word-game-category',
    'NC03-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc03-r3-1-word-game-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc03-r3-1-word-game-category-min.svg',
    wordGameCategorySvg,
  ),
  'tile-puzzle-category': asset(
    'tile-puzzle-category',
    'NC04-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc04-r3-1-tile-puzzle-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc04-r3-1-tile-puzzle-category-min.svg',
    tilePuzzleCategorySvg,
  ),
  'logic-puzzle-category': asset(
    'logic-puzzle-category',
    'NC05-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc05-r3-1-logic-puzzle-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc05-r3-1-logic-puzzle-category-min.svg',
    logicPuzzleCategorySvg,
  ),
  'card-games-category': asset(
    'card-games-category',
    'NC06-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc06-r3-1-card-games-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc06-r3-1-card-games-category-min.svg',
    cardGamesCategorySvg,
  ),
  'board-game-category': asset(
    'board-game-category',
    'NC07-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc07-r3-1-board-game-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc07-r3-1-board-game-category-min.svg',
    boardGameCategorySvg,
  ),
  'pass-and-play-category': asset(
    'pass-and-play-category',
    'NC08-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc08-r3-1-pass-and-play-category.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc08-r3-1-pass-and-play-category-min.svg',
    passAndPlayCategorySvg,
  ),
  'guides-section': asset(
    'guides-section',
    'NC09-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc09-r3-1-guides-section.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc09-r3-1-guides-section-min.svg',
    guidesSectionSvg,
  ),
  'tools-section': asset(
    'tools-section',
    'NC10-R3.1',
    'brand/nocharge/batch-01-r3.1/source/nc10-r3-1-tools-section.svg',
    'brand/nocharge/batch-01-r3.1/optimized/nc10-r3-1-tools-section-min.svg',
    toolsSectionSvg,
  ),
  'discovery-wheel-tool': asset(
    'discovery-wheel-tool',
    'NC11-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc11-b02-r3-1-discovery-wheel.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc11-b02-r3-1-discovery-wheel-min.svg',
    DiscoveryWheelToolSvg,
  ),
  'game-finder-tool': asset(
    'game-finder-tool',
    'NC12-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc12-b02-r3-1-game-finder.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc12-b02-r3-1-game-finder-min.svg',
    GameFinderToolSvg,
  ),
  'session-planner-tool': asset(
    'session-planner-tool',
    'NC13-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc13-b02-r3-1-session-planner.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc13-b02-r3-1-session-planner-min.svg',
    SessionPlannerToolSvg,
  ),
  'random-activity-tool': asset(
    'random-activity-tool',
    'NC14-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc14-b02-r3-1-random-activity.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc14-b02-r3-1-random-activity-min.svg',
    RandomActivityToolSvg,
  ),
  'ambient-mixer-tool': asset(
    'ambient-mixer-tool',
    'NC15-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc15-b02-r3-1-ambient-mixer.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc15-b02-r3-1-ambient-mixer-min.svg',
    AmbientMixerToolSvg,
  ),
  'singing-bowl-tool': asset(
    'singing-bowl-tool',
    'NC16-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc16-b02-r3-1-singing-bowl-engine.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc16-b02-r3-1-singing-bowl-engine-min.svg',
    SingingBowlToolSvg,
  ),
  'reduced-motion-tool': asset(
    'reduced-motion-tool',
    'NC17-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc17-b02-r3-1-reduced-motion-tester.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc17-b02-r3-1-reduced-motion-tester-min.svg',
    ReducedMotionToolSvg,
  ),
  'touch-target-tool': asset(
    'touch-target-tool',
    'NC18-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc18-b02-r3-1-touch-target-checker.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc18-b02-r3-1-touch-target-checker-min.svg',
    TouchTargetToolSvg,
  ),
  'storage-inspector-tool': asset(
    'storage-inspector-tool',
    'NC19-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc19-b02-r3-1-storage-inspector.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc19-b02-r3-1-storage-inspector-min.svg',
    StorageInspectorToolSvg,
  ),
  'zoom-visualizer-tool': asset(
    'zoom-visualizer-tool',
    'NC20-B02-R3.1',
    'brand/nocharge/batch-02-r3.1/source/nc20-b02-r3-1-zoom-visualizer.svg',
    'brand/nocharge/batch-02-r3.1/optimized/nc20-b02-r3-1-zoom-visualizer-min.svg',
    ZoomVisualizerToolSvg,
  ),
};

/** Unknown or stale references fail closed so AdaptiveIcon can render its fallback. */
export function resolveAssetIcon(id: unknown): AdaptiveSvgAsset | undefined {
  return isAssetIconId(id) ? approvedAssetIcons[id] : undefined;
}
