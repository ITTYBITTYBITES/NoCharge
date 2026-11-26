import type { ComponentType } from 'react';
import type { AssetIconId } from '../assets/iconIds';

export type ContentStatus = 'draft' | 'published' | 'archived';

export type ContentSection = 'arcade' | 'experiences' | 'tools' | 'guides';

export type InteractiveModuleId =
  | 'pattern-pairs'
  | 'sum-sprint'
  | 'simon'
  | 'lights-out'
  | 'last-token'
  | 'hangman'
  | 'tic-tac-toe'
  | 'four-in-a-row'
  | 'twenty-forty-eight'
  | 'word-loom'
  | 'beacon-lattice'
  | 'checkers'
  | 'color-flip'
  | 'dots-and-boxes'
  | 'freecell'
  | 'gomoku'
  | 'klondike'
  | 'memory-match'
  | 'minesweeper'
  | 'mini-sudoku'
  | 'nine-mens-morris'
  | 'nonogram'
  | 'pass-the-picture'
  | 'reversi'
  | 'sudoku-9x9'
  | 'tile-garden'
  | 'word-search'
  | 'word-tile-rush'
  | 'draft-game'
  | 'coos-joint-coffee-idle'
  | 'two-second-witness'
  | 'word-counter'
  | 'json-workbench'
  | 'contrast-checker'
  | 'discovery-wheel'
  | 'game-finder'
  | 'session-planner'
  | 'random-activity'
  | 'ambient-mixer'
  | 'singing-bowl-engine'
  | 'reduced-motion-tester'
  | 'touch-target-checker'
  | 'storage-inspector'
  | 'zoom-visualizer'
  | 'nonogram-clue-calculator'
  | 'solitaire-comparator'
  | 'sudoku-helper'
  | 'focus-order-demo'
  | 'word-scoring';

export type InteractiveModuleLoader = () => Promise<{ default: ComponentType }>;

export interface SEOFields {
  title: string;
  description: string;
}

export interface CatalogEntryBase<S extends ContentSection, K extends string> {
  id: string;
  slug: string;
  status: ContentStatus;
  title: string;
  summary: string;
  section: S;
  kind: K;
  category: string;
  tags: readonly string[];
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  seo: SEOFields;
  /** Explicit, registry-resolved links; drafts may point to other drafts. */
  relatedSlugs?: readonly string[];
  /** Optional, manifest-backed inline icon; game entries must not receive tool artwork. */
  assetIconId?: AssetIconId | null;
}

export type ArcadeRuntimeContractVersion = 'nocharge-arcade-v1';
export type ArcadeBreakPoint = 'round-end' | 'game-over';
export type ArcadePauseReason = 'hidden' | 'blur' | 'ad-break';
export type ArcadeGameOutcome = 'win' | 'loss' | 'draw';

export interface ArcadeBreakEvent {
  outcome: ArcadeGameOutcome;
  /** One-based round/sequence number shown to the player. */
  round: number;
}

/** Every Arcade runtime exposes lifecycle actions and explicit natural break callbacks. */
export interface ArcadeGameRuntime {
  init(): void;
  start(): void;
  pause(reason: ArcadePauseReason): void;
  resume(): void;
  destroy(): void;
  onRoundEnd(event: ArcadeBreakEvent): Promise<void>;
  onGameOver(event: ArcadeBreakEvent): Promise<void>;
}

export interface ArcadeDocumentation {
  howToPlay: readonly string[];
  controls: readonly string[];
  rulesAndScoring: readonly string[];
  tips: readonly string[];
  relatedIntro: string;
}

export interface ArcadeItem extends CatalogEntryBase<'arcade', 'arcade'> {
  moduleId:
    | 'pattern-pairs' | 'sum-sprint' | 'simon'
    | 'lights-out' | 'last-token' | 'hangman' | 'tic-tac-toe'
    | 'four-in-a-row' | 'twenty-forty-eight' | 'word-loom'
    | 'beacon-lattice' | 'checkers' | 'color-flip' | 'dots-and-boxes' | 'freecell'
    | 'gomoku' | 'klondike' | 'memory-match' | 'minesweeper' | 'mini-sudoku'
    | 'nine-mens-morris' | 'nonogram' | 'pass-the-picture' | 'reversi' | 'sudoku-9x9'
    | 'tile-garden' | 'word-search' | 'word-tile-rush' | 'draft-game';
  moduleLoader: InteractiveModuleLoader;
  /** Explicit lifecycle contract required by all published Arcade modules. */
  runtimeContract: ArcadeRuntimeContractVersion;
  /** Only these natural end states may request the dormant H5 adapter. */
  h5Breakpoints: readonly ArcadeBreakPoint[];
  instructions: string;
  controls: readonly string[];
  documentation: ArcadeDocumentation;
  /** Published Arcade entries link only to relevant, published Tools or Guides. */
  relatedSlugs: readonly string[];
}

export interface ExperienceFAQ {
  question: string;
  answer: string;
}

export interface ExperienceTrailer {
  title: string;
  videoId: string;
}

export interface ExperienceWorkflow {
  title: string;
  summary: string;
  steps: readonly string[];
}

export interface ExperienceUseCase {
  title: string;
  description: string;
}

export interface ExperienceArtwork {
  manifestAssetId: string;
  runtimeManifestAssetId: string;
  /** Path below the Vite public base, mirrored from the manifest-listed local derivative. */
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface ExperienceDocumentation {
  overview: readonly string[];
  keyFeatures: readonly string[];
  /** Present only for locally authored interactive Experiences. */
  howDemoWorks?: readonly string[];
  /** Editorial workflows used by static product mini-sites. */
  directAnswer?: string;
  workflows?: readonly ExperienceWorkflow[];
  useCases?: readonly ExperienceUseCase[];
  evaluationQuestions?: readonly string[];
  artwork?: readonly ExperienceArtwork[];
  platformAndAvailability: readonly string[];
  faq: readonly ExperienceFAQ[];
}

export type ExperienceAppLegalSlug = 'coosjoint' | 'twosecondwitness' | 'profivue' | 'rideside';

interface ExperienceItemBase extends CatalogEntryBase<'experiences', 'experience'> {
  relatedSlugs: readonly string[];
  /** Official application website; separate from the NoCharge route and Shop. */
  productWebsiteUrl?: string;
  /** Only populated when the owner supplies a verified official Google Play URL. */
  googlePlayUrl?: string;
  /** Verified creator-owned itch.io project page, when one is published. */
  itchIoUrl?: string;
  /** Verified direct social profile URL; currently limited to Coo's Joint's Facebook profile. */
  facebookUrl?: string;
  /** An approved YouTube video ID, loaded only after an explicit play gesture. */
  youtubeTrailers?: readonly ExperienceTrailer[];
  /** App-specific legal route slug for an actual Android app; draft status is shown separately. */
  appLegalSlug?: ExperienceAppLegalSlug;
  /** A future candidate marker only; it never enables or initializes advertising. */
  h5GamesAdsCandidate?: boolean;
}

export interface InteractiveExperienceItem extends ExperienceItemBase {
  /** Omitted on legacy records; these remain interactive by default. */
  presentation?: 'interactive-demo';
  moduleId:
    | 'coos-joint-coffee-idle'
    | 'two-second-witness';
  moduleLoader: InteractiveModuleLoader;
  instructions: string;
  controls: readonly string[];
  documentation: ExperienceDocumentation & { howDemoWorks: readonly string[] };
}

export interface ShowcaseExperienceItem extends ExperienceItemBase {
  presentation: 'showcase';
  moduleId?: never;
  moduleLoader?: never;
  instructions?: never;
  controls?: never;
  documentation: ExperienceDocumentation & {
    howDemoWorks?: never;
    directAnswer?: never;
    workflows?: never;
    useCases?: never;
    evaluationQuestions?: never;
    artwork?: never;
  };
}

export interface EditorialExperienceItem extends ExperienceItemBase {
  presentation: 'editorial-mini-site';
  appLegalSlug: 'profivue' | 'rideside';
  moduleId?: never;
  moduleLoader?: never;
  instructions?: never;
  controls?: never;
  productWebsiteUrl: string;
  googlePlayUrl?: never;
  itchIoUrl?: never;
  documentation: ExperienceDocumentation & {
    directAnswer: string;
    howDemoWorks?: never;
    workflows: readonly ExperienceWorkflow[];
    useCases: readonly ExperienceUseCase[];
    evaluationQuestions: readonly string[];
    artwork: readonly ExperienceArtwork[];
  };
}

export type ExperienceItem = InteractiveExperienceItem | ShowcaseExperienceItem | EditorialExperienceItem;

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolWorkedExample {
  scenario: string;
  input?: string;
  steps: readonly string[];
  result: string;
}

export interface ToolItem extends CatalogEntryBase<'tools', 'tool'> {
  moduleId:
    | 'word-counter' | 'json-workbench' | 'contrast-checker'
    | 'discovery-wheel' | 'game-finder' | 'session-planner' | 'random-activity'
    | 'ambient-mixer' | 'singing-bowl-engine' | 'reduced-motion-tester' | 'touch-target-checker'
    | 'storage-inspector' | 'zoom-visualizer' | 'nonogram-clue-calculator'
    | 'solitaire-comparator' | 'sudoku-helper' | 'focus-order-demo' | 'word-scoring';
  moduleLoader: InteractiveModuleLoader;
  instructions: string;
  controls: readonly string[];
  howItWorks: readonly string[];
  workedExample: ToolWorkedExample;
  pitfalls: readonly string[];
  faq: readonly ToolFAQ[];
  relatedSlugs: readonly string[];
}

export interface GuideSection {
  heading: string;
  paragraphs: readonly string[];
  steps?: readonly string[];
}

export interface GuideArticle extends CatalogEntryBase<'guides', 'guide'> {
  sections: readonly GuideSection[];
  relatedSlugs: readonly string[];
}

export type CatalogEntry = ArcadeItem | ExperienceItem | ToolItem | GuideArticle;
export type PublishedCatalogEntry = CatalogEntry & Readonly<{ status: 'published' }>;

export interface SectionDefinition {
  id: ContentSection;
  title: string;
  eyebrow: string;
  description: string;
  path: string;
  icon: 'arcade' | 'apps' | 'tools' | 'guides';
  /** Approved Batch 01 asset used only in the matching section heading; null renders a structural fallback. */
  assetIconId?: AssetIconId | null;
}
