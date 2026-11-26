import {
  assertValidContentRegistry,
  contentRegistry,
  countUniqueProseWords,
  getFacets,
  getFeaturedEntries,
  getPublishedBySection,
  getPublishedBySlug,
  getPublishedEntries,
  getRelatedEntries,
  validateContentRegistry,
} from './registry';
import type { CatalogEntry, GuideArticle, ToolItem } from './schemas';
import { createSearchIndex, normalizeSearchText, searchSite } from '../search';
import { scoreWordGuess } from '../modules/arcade/WordLoom';
import { addTile, hasLegalMove, moveBoard, startingBoard } from '../modules/arcade/TwentyFortyEight';
import {
  allCheckersLegalMoves,
  createInitialPhase4cState,
  getStraightPath,
  hasFive,
  isValidSudokuEntry,
  morrisNeighbors,
  phase4cTransition,
  reversiLegalMoves,
} from '../modules/arcade/phase4c-engines';
import type { Phase4cGameId } from '../modules/arcade/phase4c-engines';

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function truthy(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

truthy(
  JSON.stringify(scoreWordGuess('APPLE', 'PUPPY')) === JSON.stringify(['present', 'absent', 'correct', 'absent', 'absent']),
  'Word Loom scores duplicate letters after exact-position copies are consumed',
);
const fourTileMerge = moveBoard([2, 2, 2, 2, ...Array(12).fill(0)], 'left');
truthy(JSON.stringify(fourTileMerge.board.slice(0, 4)) === JSON.stringify([4, 4, 0, 0]), 'Twenty Forty-Eight merges each source tile at most once per slide');
equal(fourTileMerge.gained, 8, 'Twenty Forty-Eight awards the value of each merged tile');
const mixedMerge = moveBoard([2, 2, 4, 4, ...Array(12).fill(0)], 'left');
truthy(JSON.stringify(mixedMerge.board.slice(0, 4)) === JSON.stringify([4, 8, 0, 0]), 'Twenty Forty-Eight does not merge a newly created tile a second time during one move');
equal(moveBoard(Array(16).fill(0), 'left').changed, false, 'Twenty Forty-Eight rejects a no-change direction');
const deterministicSpawnA = addTile(startingBoard(), 0x2048cafe);
const deterministicSpawnB = addTile(startingBoard(), 0x2048cafe);
truthy(JSON.stringify(deterministicSpawnA) === JSON.stringify(deterministicSpawnB), 'Twenty Forty-Eight uses a reproducible local spawn sequence after reset');
equal(deterministicSpawnA.board.filter((tile) => tile > 0).length, 3, 'a valid Twenty Forty-Eight move spawns exactly one tile');
const blockedBoard = [2, 4, 8, 16, 4, 8, 16, 2, 8, 16, 2, 4, 16, 2, 4, 8];
equal(hasLegalMove(blockedBoard), false, 'Twenty Forty-Eight identifies a full board with no equal neighbors as terminal');

const phase4cIds: Phase4cGameId[] = [
  'beacon-lattice', 'checkers', 'color-flip', 'dots-and-boxes', 'freecell', 'gomoku', 'klondike', 'memory-match',
  'minesweeper', 'mini-sudoku', 'nine-mens-morris', 'nonogram', 'pass-the-picture', 'reversi', 'sudoku-9x9',
  'tile-garden', 'word-search', 'word-tile-rush',
];
for (const game of phase4cIds) {
  truthy(JSON.stringify(createInitialPhase4cState(game)) === JSON.stringify(createInitialPhase4cState(game)), `${game} reset starts from a deterministic seeded state`);
}
const phase4cRegistryEntries = contentRegistry.filter((entry) => entry.section === 'arcade' && phase4cIds.includes(entry.slug as Phase4cGameId));
equal(phase4cRegistryEntries.length, 18, 'all remaining Tier 2 and Tier 3 games have registry records');
for (const entry of phase4cRegistryEntries) {
  truthy(entry.kind === 'arcade' && entry.status === 'published', `${entry.slug} passes the content publication gate`);
  truthy(entry.kind === 'arcade' && entry.runtimeContract === 'nocharge-arcade-v1' && entry.h5Breakpoints.join(',') === 'game-over', `${entry.slug} has only its terminal natural lifecycle boundary`);
  truthy(entry.kind === 'arcade' && entry.documentation.howToPlay.length >= 3 && entry.documentation.controls.length >= 3
    && entry.documentation.rulesAndScoring.length >= 3 && entry.documentation.tips.length >= 3
    && entry.documentation.relatedIntro.length >= 80, `${entry.slug} has complete static documentation`);
}

let beacon = createInitialPhase4cState('beacon-lattice');
for (const [piece, turns, anchor] of [[0, 3, 0], [1, 2, 1], [2, 0, 4], [3, 0, 10], [4, 3, 15]]) {
  beacon = phase4cTransition('beacon-lattice', beacon, { type: 'select-piece', piece }).state;
  for (let turn = 0; turn < turns; turn += 1) beacon = phase4cTransition('beacon-lattice', beacon, { type: 'rotate' }).state;
  const result = phase4cTransition('beacon-lattice', beacon, { type: 'place', cell: anchor });
  beacon = result.state;
  if (piece === 4) equal(result.outcome, 'win', 'five distinct beacon pentominoes can cover every lattice cell exactly once');
}
const checkersBoard = Array(64).fill(null) as (string | null)[];
checkersBoard[17] = 'r'; checkersBoard[10] = 'b';
const requiredCaptures = allCheckersLegalMoves(checkersBoard, 'r');
truthy(requiredCaptures.length > 0 && requiredCaptures.every((move) => move.capture), 'Checkers makes a legal capture mandatory when available');
const colorStart = createInitialPhase4cState('color-flip');
const colorCycle = phase4cTransition('color-flip', colorStart, { type: 'mode', mode: 'cycle' }).state;
const colorStep = phase4cTransition('color-flip', colorCycle, { type: 'step' });
equal(colorStep.state.activeColor, 'teal', 'Color Flip cycling mode advances the selected palette');
let boxes = createInitialPhase4cState('dots-and-boxes');
let lastBoxesResult;
for (let row = 0; row < 5; row += 1) for (let column = 0; column < 4; column += 1) {
  if (boxes.handoff) boxes = phase4cTransition('dots-and-boxes', boxes, { type: 'ready' }).state;
  lastBoxesResult = phase4cTransition('dots-and-boxes', boxes, { type: 'edge', orientation: 'h', row, column }); boxes = lastBoxesResult.state;
}
for (let row = 0; row < 4; row += 1) for (let column = 0; column < 5; column += 1) {
  if (boxes.handoff) boxes = phase4cTransition('dots-and-boxes', boxes, { type: 'ready' }).state;
  lastBoxesResult = phase4cTransition('dots-and-boxes', boxes, { type: 'edge', orientation: 'v', row, column }); boxes = lastBoxesResult.state;
}
equal(boxes.complete, true, 'Dots & Boxes finishes only after all forty edges and sixteen boxes are resolved');
equal(lastBoxesResult?.breakpoint, 'game-over', 'Dots & Boxes reports its natural full-board result');
let gomoku = createInitialPhase4cState('gomoku');
for (let offset = 0; offset < 5; offset += 1) {
  if (gomoku.handoff) gomoku = phase4cTransition('gomoku', gomoku, { type: 'ready' }).state;
  const move = phase4cTransition('gomoku', gomoku, { type: 'place', index: 105 + offset }); gomoku = move.state;
  if (offset === 4) equal(move.outcome, 'win', 'Gomoku recognizes five connected stones in a row');
  else {
    gomoku = phase4cTransition('gomoku', gomoku, { type: 'ready' }).state;
    gomoku = phase4cTransition('gomoku', gomoku, { type: 'place', index: offset * 2 }).state;
  }
}
equal(hasFive(Array.from({ length: 225 }, (_, index) => index >= 110 && index <= 114 ? 'X' : null), 112, 'X'), true, 'Gomoku win detection includes a continuous horizontal line');
const freecell = createInitialPhase4cState('freecell');
equal(freecell.tableau.reduce((total: number, pile: unknown[]) => total + pile.length, 0), 52, 'FreeCell deals all 52 cards to its eight tableau columns');
const klondike = createInitialPhase4cState('klondike');
equal(klondike.tableau.reduce((total: number, pile: unknown[]) => total + pile.length, 0) + klondike.stock.length, 52, 'Klondike deals all 52 cards between tableau and stock');
let memory = createInitialPhase4cState('memory-match');
const memoryPairs = new Map<string, number[]>();
(memory.deck as string[]).forEach((symbol, index) => memoryPairs.set(symbol, [...(memoryPairs.get(symbol) ?? []), index]));
let memoryResult;
for (const pair of memoryPairs.values()) {
  for (const index of pair) memory = phase4cTransition('memory-match', memory, { type: 'flip', index }).state;
}
memoryResult = { state: memory };
equal(memoryResult.state.complete, true, 'Memory Match completes after all eight pairs are found');
const mineStart = createInitialPhase4cState('minesweeper');
const firstReveal = phase4cTransition('minesweeper', mineStart, { type: 'reveal', index: 0 });
equal(firstReveal.state.cells[0].mine, false, 'Minesweeper guarantees a safe first reveal');
equal(firstReveal.state.firstClick, false, 'Minesweeper seeds its mine map on the first reveal');
const miniSudoku = createInitialPhase4cState('mini-sudoku');
equal(miniSudoku.board.filter((cell: number) => cell === 0).length, 25, 'Mini Sudoku opens twenty-five cells in its authored six-by-six puzzle');
truthy(isValidSudokuEntry(miniSudoku.solution, 6, 5, miniSudoku.solution[5]), 'Mini Sudoku helper accepts a valid solution digit');
equal(isValidSudokuEntry(miniSudoku.solution, 6, 5, 3), false, 'Sudoku duplicate validation rejects a repeated row, column, or box digit');
const morris = createInitialPhase4cState('nine-mens-morris');
equal(morris.reserve.join(','), '9,9', 'Nine Men’s Morris starts with nine reserve stones for each player');
equal(morrisNeighbors(0).join(','), '1,9', 'Nine Men’s Morris exposes only connected adjacent points');
let nonogram = createInitialPhase4cState('nonogram');
let nonogramResult;
for (let index = 0; index < nonogram.solution.length; index += 1) if (nonogram.solution[index]) nonogramResult = phase4cTransition('nonogram', nonogram, { type: 'toggle', index }), nonogram = nonogramResult.state;
equal(nonogramResult?.outcome, 'win', 'Nonogram completes when every required solution cell is filled without extra marks');
let picture = createInitialPhase4cState('pass-the-picture');
let pictureResult;
for (let pass = 0; pass < 8; pass += 1) {
  if (picture.handoff) picture = phase4cTransition('pass-the-picture', picture, { type: 'ready' }).state;
  pictureResult = phase4cTransition('pass-the-picture', picture, { type: 'stroke', points: [{ x: pass * 10, y: pass * 10 }] });
  picture = pictureResult.state;
}
equal(pictureResult?.outcome, 'win', 'Pass the Picture ends on the eighth natural drawing pass');
const reversi = createInitialPhase4cState('reversi');
equal(reversiLegalMoves(reversi.board, 1).length, 4, 'Reversi opening position exposes the four standard legal moves');
truthy(getStraightPath(0, 18, 8).length === 3 && getStraightPath(0, 17, 8).length === 0, 'Word Search accepts straight paths and rejects bent paths');
let garden = createInitialPhase4cState('tile-garden');
garden = phase4cTransition('tile-garden', garden, { type: 'plant', index: 0 }).state;
equal(garden.board[9], 2, 'Tile Garden merges a completed two-by-two group into the next tier');
let rush = createInitialPhase4cState('word-tile-rush');
rush = { ...rush, grid: Array(48).fill(''), path: [], startedClock: false };
for (const [index, letter] of [[36, 'S'], [37, 'T'], [43, 'A'], [44, 'R']] as [number, string][]) rush.grid[index] = letter;
for (const index of [36, 37, 43, 44]) rush = phase4cTransition('word-tile-rush', rush, { type: 'tile', index }).state;
const rushResult = phase4cTransition('word-tile-rush', rush, { type: 'submit-word' });
equal(rushResult.state.score, 4, 'Word Tile Rush awards one point for each letter in an accepted local word');
equal(rushResult.state.rowsAdded, 1, 'Word Tile Rush raises the grid after an accepted word');

assertValidContentRegistry(contentRegistry);
equal(contentRegistry.length, 53, 'registry contains 28 Arcade games, five static Experiences, 18 Tools, and two Guides');
const expectedCounts = { arcade: 28, experiences: 5, tools: 18, guides: 2 } as const;
for (const [section, expected] of Object.entries(expectedCounts) as [keyof typeof expectedCounts, number][]) {
  equal(getPublishedBySection(section).length, expected, `${section} has the expected published entry count`);
}

equal(getPublishedEntries().length, 53, 'published selector returns all valid, gated registry entries');
const publishedExperiences = getPublishedBySection('experiences');
equal(publishedExperiences.length, 5, 'three static app/release showcases and two editorial product overviews are published');
for (const experience of publishedExperiences) {
  const hasExpectedDocumentation = experience.kind === 'experience'
    && experience.documentation.overview.length >= 2
    && experience.documentation.keyFeatures.length >= 3
    && experience.documentation.platformAndAvailability.length >= 2
    && experience.documentation.faq.length >= 3
    && (experience.presentation === 'editorial-mini-site'
      ? experience.documentation.directAnswer.length >= 80
        && experience.documentation.workflows.length >= 2
        && experience.documentation.useCases.length >= 3
        && experience.documentation.artwork.length >= 1
      : experience.presentation === 'showcase'
        ? !experience.documentation.howDemoWorks && !('moduleLoader' in experience)
        : experience.documentation.howDemoWorks.length >= 2);
  truthy(hasExpectedDocumentation, `${experience.slug} has the documentation required by its static or interactive presentation`);
  truthy(experience.kind === 'experience' && getRelatedEntries(experience, 3).length > 0,
    `${experience.slug} resolves its authored related registry entries`);
}
for (const slug of ['coosjoint', 'twosecondwitness']) {
  const productExperience = getPublishedBySlug('experiences', slug);
  truthy(productExperience?.kind === 'experience' && productExperience.presentation === 'showcase'
    && !('moduleLoader' in productExperience) && productExperience.productWebsiteUrl?.startsWith('https://')
    && productExperience.appLegalSlug === slug && productExperience.youtubeTrailers?.length === 1,
  `${slug} is a static app showcase with its matching legal route, product site, and click-only trailer`);
}
for (const slug of ['profivue', 'rideside']) {
  const productExperience = getPublishedBySlug('experiences', slug);
  truthy(productExperience?.kind === 'experience' && productExperience.presentation === 'editorial-mini-site'
    && !('moduleLoader' in productExperience) && productExperience.productWebsiteUrl?.startsWith('https://')
    && productExperience.documentation.workflows.length >= 2 && productExperience.documentation.artwork.length >= 1,
  `${slug} is a static editorial mini-site with local artwork, workflows, and no demo loader`);
}
const coosJointExperience = getPublishedBySlug('experiences', 'coosjoint');
truthy(coosJointExperience?.kind === 'experience'
  && coosJointExperience.googlePlayUrl === 'https://play.google.com/store/apps/details?id=com.ittybittybites.cooscafe'
  && coosJointExperience.itchIoUrl === 'https://ittybittybites.itch.io/coos-joint-idle-coffee-syndicate'
  && coosJointExperience.facebookUrl === 'https://www.facebook.com/profile.php?id=61596369614569',
'Coo’s Joint retains its verified Google Play, creator-owned itch.io, and direct Facebook profile URLs');
const coosJointWithoutFacebook = contentRegistry.map((entry) => entry.slug === 'coosjoint' && entry.kind === 'experience'
  ? { ...entry, facebookUrl: undefined }
  : entry);
truthy(validateContentRegistry(coosJointWithoutFacebook).some((issue) => issue.code === 'invalid-content'
  && issue.slug === 'coosjoint' && issue.message.includes('Facebook')),
'Coo’s Joint publication rejects a missing required Facebook profile destination');
const coosJointWithWrongFacebook = contentRegistry.map((entry) => entry.slug === 'coosjoint' && entry.kind === 'experience'
  ? { ...entry, facebookUrl: 'https://facebook.com/another-profile' }
  : entry);
truthy(validateContentRegistry(coosJointWithWrongFacebook).some((issue) => issue.code === 'invalid-content'
  && issue.slug === 'coosjoint' && issue.message.includes('Facebook')),
'Coo’s Joint publication rejects a Facebook URL other than the specifically approved profile');
const twoSecondWitnessExperience = getPublishedBySlug('experiences', 'twosecondwitness');
truthy(twoSecondWitnessExperience?.kind === 'experience'
  && twoSecondWitnessExperience.googlePlayUrl === 'https://play.google.com/store/apps/details?id=com.ittybittybites.the2secondwitness'
  && twoSecondWitnessExperience.itchIoUrl === 'https://ittybittybites.itch.io/2-second-witness',
'The 2-Second Witness publishes only its verified Google Play app-details and itch.io project URLs');
equal(publishedExperiences.filter((entry) => entry.kind === 'experience' && entry.googlePlayUrl).length, 2,
  'only the two individually verified app records publish their own Google Play destinations');
equal(publishedExperiences.filter((entry) => entry.kind === 'experience' && entry.itchIoUrl).length, 3,
  'the two verified app projects and the verified BRC prototype publish their own itch.io destinations');
const barnRoadChroniclesExperience = getPublishedBySlug('experiences', 'barn-road-chronicles');
truthy(barnRoadChroniclesExperience?.kind === 'experience'
  && barnRoadChroniclesExperience.presentation === 'showcase'
  && !('moduleId' in barnRoadChroniclesExperience)
  && !('moduleLoader' in barnRoadChroniclesExperience)
  && barnRoadChroniclesExperience.itchIoUrl === 'https://ittybittybites.itch.io/barn-road-chronicles-act-1/'
  && !barnRoadChroniclesExperience.productWebsiteUrl
  && !barnRoadChroniclesExperience.googlePlayUrl
  && !barnRoadChroniclesExperience.appLegalSlug
  && barnRoadChroniclesExperience.h5GamesAdsCandidate === true,
'Barn Road Chronicles is an itch.io-only static showcase and future H5 Games Ads candidate without a local demo or app-store destination');
truthy(barnRoadChroniclesExperience?.kind === 'experience'
  && barnRoadChroniclesExperience.documentation.overview.some((paragraph) => paragraph.includes('HTML5'))
  && barnRoadChroniclesExperience.documentation.keyFeatures.some((feature) => feature.includes('future H5 Games Ads candidate'))
  && barnRoadChroniclesExperience.documentation.platformAndAvailability.some((paragraph) => paragraph.includes('Prototype')),
'Barn Road Chronicles documents its creator-hosted prototype, future candidate status, and availability in its own copy');
const brcWithUnverifiedItchHost = contentRegistry.map((entry) => entry.slug === 'barn-road-chronicles' && entry.kind === 'experience' && entry.presentation !== 'editorial-mini-site'
  ? { ...entry, itchIoUrl: 'https://another-creator.itch.io/barn-road-chronicles-act-1/' }
  : entry);
truthy(validateContentRegistry(brcWithUnverifiedItchHost).some((issue) => issue.code === 'invalid-content'
  && issue.slug === 'barn-road-chronicles' && issue.message.includes('itchIoUrl')),
'Barn Road Chronicles rejects a project URL on any unverified creator host');
const brcWithoutVerifiedTrailingSlash = contentRegistry.map((entry) => entry.slug === 'barn-road-chronicles' && entry.kind === 'experience' && entry.presentation !== 'editorial-mini-site'
  ? { ...entry, itchIoUrl: 'https://ittybittybites.itch.io/barn-road-chronicles-act-1' }
  : entry);
truthy(validateContentRegistry(brcWithoutVerifiedTrailingSlash).some((issue) => issue.code === 'invalid-content'
  && issue.slug === 'barn-road-chronicles' && issue.message.includes('itchIoUrl')),
'Barn Road Chronicles requires its exact verified creator listing path');
const firstExperience = getPublishedBySlug('experiences', 'barn-road-chronicles');
truthy(firstExperience?.kind === 'experience' && firstExperience.presentation === 'showcase',
  'a static Experience record is available for publication-gate fixtures');
const incompleteExperience = {
  ...firstExperience,
  id: 'test-incomplete-experience',
  slug: 'test-incomplete-experience',
  title: 'Incomplete Experience Draft Fixture',
  status: 'published' as const,
  seo: { title: 'Incomplete Experience Fixture | NoCharge', description: 'A unique fixture to verify the Experience publication gate rejects missing documentation.' },
  relatedSlugs: ['session-planner'],
  documentation: { overview: [], keyFeatures: [], platformAndAvailability: [], faq: [] },
};
truthy(validateContentRegistry([incompleteExperience]).some((issue) => issue.code === 'invalid-content'),
  'published Experiences without all five substantive documentation sections are rejected');
truthy(validateContentRegistry([incompleteExperience]).some((issue) => issue.code === 'experience-word-count'),
  'published Experiences below the authored-copy minimum are rejected');

equal(getPublishedBySlug('arcade', 'pattern-pairs')?.title, 'Pattern Pairs', 'published detail lookup is section/slug driven');
equal(getPublishedBySlug('tools', 'contrast-checker')?.title, 'Contrast Checker', 'the new contrast utility is registered as a published tool');
equal(getPublishedBySlug('arcade', 'missing-entry'), undefined, 'unknown slug is not public');
equal(getPublishedBySlug('tools', 'pattern-pairs'), undefined, 'slug lookup is scoped to the requested section');
equal(getFeaturedEntries('arcade').length, 1, 'featured selector uses published registry metadata');

const patternPairs = getPublishedBySlug('arcade', 'pattern-pairs');
truthy(patternPairs, 'Pattern Pairs exists as published content');
const simon = getPublishedBySlug('arcade', 'simon');
truthy(simon && simon.kind === 'arcade', 'Simon remains a published Tier 1 reference game');
equal(simon?.kind === 'arcade' ? simon.moduleId : undefined, 'simon', 'Simon resolves to its clean-room module');
equal(simon?.kind === 'arcade' ? simon.runtimeContract : undefined, 'nocharge-arcade-v1', 'Simon publishes the typed runtime contract');
truthy(simon?.kind === 'arcade' && simon.h5Breakpoints.join(',') === 'round-end,game-over', 'Simon exposes only natural round-end and terminal H5 breakpoints');
truthy(simon?.kind === 'arcade' && simon.documentation.howToPlay.length >= 3
  && simon.documentation.controls.length >= 3 && simon.documentation.rulesAndScoring.length >= 3
  && simon.documentation.tips.length >= 3, 'Simon has the complete static editorial sections');
const related = getRelatedEntries(patternPairs, 3);
truthy(related.length > 0, 'related selector finds relevant published entries');
truthy(related.every((entry) => entry.id !== patternPairs.id && entry.status === 'published'), 'related selector excludes the current record and all unpublished statuses');
const wordCounter = getPublishedBySlug('tools', 'word-counter');
truthy(wordCounter, 'Word Counter exists as a published entry');
truthy(wordCounter.kind === 'tool', 'Word Counter is a published tool with structured documentation');
const explicitRelated = getRelatedEntries(wordCounter, 3);
equal(explicitRelated[0]?.slug, 'json-workbench', 'tools use their authored relatedSlugs in the declared order');
truthy(explicitRelated.every((entry) => entry.kind === 'tool' || entry.kind === 'guide'), 'tool related links are guides or tools');

const draftFixture: CatalogEntry = {
  ...contentRegistry[0]!,
  id: 'test-draft-private-record',
  slug: 'test-draft-private-record',
  status: 'draft',
  title: 'Secret Draft Phrase',
  summary: 'A complete-looking draft fixture used only to prove publication gating in tests.',
  category: 'Private Draft Category',
  tags: ['private-draft-token'],
  featured: true,
  seo: { title: 'Private draft SEO title', description: 'Private draft SEO description stays out of published metadata.' },
};
const archivedFixture: CatalogEntry = {
  ...contentRegistry[1]!,
  id: 'test-archived-private-record',
  slug: 'test-archived-private-record',
  status: 'archived',
  title: 'Secret Archived Phrase',
  summary: 'An archived fixture kept in the test registry to verify strict public exclusion.',
  category: 'Private Archive Category',
  tags: ['private-archive-token'],
  featured: true,
  seo: { title: 'Private archived SEO title', description: 'Private archived SEO description stays out of published metadata.' },
};
const draftShortTool: ToolItem = {
  ...wordCounter,
  id: 'test-short-tool-draft',
  slug: 'test-short-tool-draft',
  status: 'draft',
  title: 'Unfinished Tool Draft',
  summary: 'An unfinished short note for this draft record.',
  seo: { title: 'Unfinished tool draft title', description: 'A short unpublished tool entry for word-count gate coverage.' },
  howItWorks: [],
  workedExample: { scenario: 'An unfinished scenario.', steps: [], result: 'An unfinished result.' },
  pitfalls: [],
  faq: [],
  relatedSlugs: ['a-local-first-workflow-for-browser-tools'],
};
const registryWithUnpublished: readonly CatalogEntry[] = [...contentRegistry, draftFixture, archivedFixture, draftShortTool];

equal(getPublishedEntries(registryWithUnpublished).length, 53, 'draft and archived records are excluded from published selectors');
equal(getPublishedBySlug('arcade', draftFixture.slug, registryWithUnpublished), undefined, 'draft detail lookup is blocked');
equal(getPublishedBySlug('arcade', archivedFixture.slug, registryWithUnpublished), undefined, 'archived detail lookup is blocked');
equal(getPublishedBySlug('tools', draftShortTool.slug, registryWithUnpublished), undefined, 'a short tool draft has no public detail route');
equal(getFeaturedEntries(undefined, registryWithUnpublished).some((entry) => entry.id === draftFixture.id || entry.id === archivedFixture.id), false, 'featured selector excludes draft and archived records');
equal(getRelatedEntries(patternPairs, 20, registryWithUnpublished).some((entry) => entry.status !== 'published'), false, 'related selector excludes unpublished records');
const facets = getFacets(registryWithUnpublished);
equal(facets.categories.includes('Private Draft Category'), false, 'facets exclude draft categories');
equal(facets.tags.includes('private-archive-token'), false, 'facets exclude archived tags');
const gatedIndex = createSearchIndex(registryWithUnpublished);
equal(gatedIndex.length, 53, 'search index is derived from published records only');
equal(searchSite('secret phrase', gatedIndex).length, 0, 'site search does not expose draft or archived content');
equal(searchSite('private-draft-token', gatedIndex).length, 0, 'site search excludes private draft tags');
equal(searchSite('unfinished tool draft', gatedIndex).length, 0, 'search excludes the short tool draft');
truthy(searchSite('pattern pairs').some((item) => item.id === 'arcade-pattern-pairs'), 'search matches published title words');
truthy(searchSite('clear board').some((item) => item.id === 'arcade-pattern-pairs'), 'search matches summary words');
truthy(searchSite('developer utilities').some((item) => item.id === 'tool-json-workbench'), 'search matches categories');
truthy(searchSite('contrast checker').some((item) => item.id === 'tool-contrast-checker'), 'search includes the published contrast utility');
truthy(searchSite('HTML5 prototype').some((item) => item.id === 'experience-barn-road-chronicles'), 'search includes the static itch.io-only BRC showcase');
equal(getPublishedBySlug('experiences', 'orbit-lab'), undefined, 'Orbit Lab has no published Experience route');
equal(getPublishedBySlug('experiences', 'pocket-beat'), undefined, 'Pocket Beat has no published Experience route');
equal(searchSite('orbit lab').length, 0, 'Orbit Lab is absent from the published search index');
equal(searchSite('pocket beat').length, 0, 'Pocket Beat is absent from the published search index');
truthy(searchSite('accessibility').some((item) => item.section === 'guides'), 'search matches guide tags');
equal(searchSite('music impossibleword').length, 0, 'search requires every query term to match');
equal(searchSite('   ').length, 0, 'empty query returns no search results');
equal(normalizeSearchText('Café — ACCESSIBILITY!'), 'cafe accessibility', 'search normalization is case- and accent-insensitive');

equal(countUniqueProseWords(['The same complete sentence has several words.', 'The same complete sentence has several words.']), 7, 'the unique prose counter does not count a repeated sentence twice');
const shortGuide: GuideArticle = {
  ...contentRegistry.find((entry): entry is GuideArticle => entry.kind === 'guide')!,
  id: 'test-short-published-guide',
  slug: 'test-short-published-guide',
  title: 'Short published guide fixture',
  summary: 'A concise but complete summary for this test record.',
  seo: { title: 'Short published guide fixture title', description: 'A unique short-guide description used only by registry validation tests.' },
  relatedSlugs: ['contrast-checker'],
  sections: Array.from({ length: 5 }, (_, index) => ({
    heading: `Section ${index + 1}`,
    paragraphs: ['This section describes a focused review method with enough context to satisfy the structural paragraph rule.'],
  })),
};
truthy(validateContentRegistry([shortGuide]).some((issue) => issue.code === 'guide-word-count'), 'published guides below 800 unique words are rejected');
const shortPublishedTool: ToolItem = {
  ...wordCounter,
  id: 'test-short-published-tool',
  slug: 'test-short-published-tool',
  title: 'Short published tool fixture',
  summary: 'A concise but complete summary for the published-tool length gate fixture.',
  seo: { title: 'Short published tool fixture title', description: 'A unique short-tool description used only by registry validation tests.' },
  relatedSlugs: ['json-workbench'],
  howItWorks: [
    'This first explanation is long enough to satisfy the separate section structure requirement for a published tool.',
    'This second explanation is also substantive, but the combined record remains far below the four-hundred-word publication minimum.',
  ],
  workedExample: {
    scenario: 'A brief scenario for the publication gate fixture.',
    input: 'A small input.',
    steps: ['Read the input.', 'Compare the result.'],
    result: 'A concise result.',
  },
  pitfalls: ['A short warning that does not add enough words to meet the publication minimum.'],
  faq: [{ question: 'Does this fixture pass?', answer: 'No, the authored explanation is intentionally too short.' }],
};
truthy(validateContentRegistry([...contentRegistry, shortPublishedTool]).some((issue) => issue.code === 'tool-word-count' && issue.slug === shortPublishedTool.slug), 'published tools below 400 unique words are rejected');
truthy(!validateContentRegistry([...contentRegistry, draftShortTool]).some((issue) => issue.code === 'tool-word-count' && issue.slug === draftShortTool.slug), 'draft tools may remain below the strict word-count gate');
const draftShortGuide: GuideArticle = {
  ...shortGuide,
  id: 'test-short-guide-draft',
  slug: 'test-short-guide-draft',
  status: 'draft',
  title: 'Short guide draft',
  summary: 'A draft guide with a brief working outline.',
  seo: { title: 'Short guide draft title', description: 'A short unpublished guide draft used for word-count checks.' },
  sections: [],
};
truthy(!validateContentRegistry([...contentRegistry, draftShortGuide]).some((issue) => issue.code === 'guide-word-count' && issue.slug === draftShortGuide.slug), 'draft guides may skip the strict 800-word gate');

const duplicateSlug = { ...contentRegistry[0]!, id: 'duplicate-slug-entry' } as CatalogEntry;
const duplicateIssues = validateContentRegistry([...contentRegistry, duplicateSlug]);
truthy(duplicateIssues.some((issue) => issue.code === 'duplicate-slug'), 'registry validation detects duplicate slugs globally');
const duplicateId = { ...contentRegistry[0]!, slug: 'duplicate-id-test' } as CatalogEntry;
truthy(validateContentRegistry([...contentRegistry, duplicateId]).some((issue) => issue.code === 'duplicate-id'), 'registry validation also detects duplicate content IDs');
let duplicateRejected = false;
try {
  assertValidContentRegistry([...contentRegistry, duplicateSlug]);
} catch (error) {
  duplicateRejected = error instanceof Error && error.message.includes('duplicate-slug');
}
truthy(duplicateRejected, 'assertion rejects duplicate slugs before prerender');

const duplicateSeoTitle = {
  ...contentRegistry[0]!,
  id: 'duplicate-seo-title-entry',
  slug: 'duplicate-seo-title-entry',
  seo: { ...contentRegistry[0]!.seo, description: 'A deliberately distinct description for this SEO test fixture.' },
} as CatalogEntry;
truthy(validateContentRegistry([...contentRegistry, duplicateSeoTitle]).some((issue) => issue.code === 'duplicate-seo-title'), 'registry validation rejects duplicate published SEO titles');
const duplicateSeoDescription = {
  ...contentRegistry[0]!,
  id: 'duplicate-seo-description-entry',
  slug: 'duplicate-seo-description-entry',
  seo: { title: 'A deliberately distinct SEO title for this test fixture.', description: contentRegistry[0]!.seo.description },
} as CatalogEntry;
truthy(validateContentRegistry([...contentRegistry, duplicateSeoDescription]).some((issue) => issue.code === 'duplicate-seo-description'), 'registry validation rejects duplicate published SEO descriptions');

const missingRelatedTarget: ToolItem = {
  ...wordCounter,
  id: 'broken-related-tool',
  slug: 'broken-related-tool',
  seo: { title: 'Broken related link test title', description: 'A unique description for the invalid related-link test fixture.' },
  relatedSlugs: ['no-such-published-entry'],
};
truthy(validateContentRegistry([...contentRegistry, missingRelatedTarget]).some((issue) => issue.code === 'invalid-related-link' && issue.slug === missingRelatedTarget.slug), 'registry validation rejects broken relatedSlugs');
const publishedLinkToDraft: ToolItem = {
  ...wordCounter,
  id: 'published-link-to-draft',
  slug: 'published-link-to-draft',
  seo: { title: 'Published draft-link test title', description: 'A unique description for a published tool linked to a draft.' },
  relatedSlugs: [draftShortTool.slug],
};
truthy(validateContentRegistry([...contentRegistry, draftShortTool, publishedLinkToDraft]).some((issue) => issue.code === 'invalid-related-link' && issue.slug === publishedLinkToDraft.slug), 'published related links cannot point to drafts');
const relatedArcadeEntry: ToolItem = {
  ...wordCounter,
  id: 'related-arcade-entry',
  slug: 'related-arcade-entry',
  seo: { title: 'Published non-tool relation test title', description: 'A unique description for an invalid cross-section related link.' },
  relatedSlugs: ['pattern-pairs'],
};
truthy(validateContentRegistry([...contentRegistry, relatedArcadeEntry]).some((issue) => issue.code === 'invalid-related-link' && issue.slug === relatedArcadeEntry.slug), 'published Tool and Guide links resolve only to Guides and Tools');

const placeholderEntry = {
  ...wordCounter,
  id: 'placeholder-content-test',
  slug: 'placeholder-content-test',
  summary: 'Lorem ipsum dolor sit amet, with enough words to pass the summary length check.',
  seo: { title: 'Placeholder phrase test title', description: 'A unique description for the phrase rejection test fixture.' },
} as CatalogEntry;
truthy(validateContentRegistry([...contentRegistry, placeholderEntry]).some((issue) => issue.code === 'placeholder-content'), 'published placeholder phrases are rejected');

const malformed = { ...contentRegistry[0]!, id: 'malformed-entry', slug: 'Bad Slug', title: ' ', status: 'unlisted', seo: { title: '', description: '' } } as unknown as CatalogEntry;
const malformedIssues = validateContentRegistry([malformed]);
truthy(malformedIssues.some((issue) => issue.code === 'invalid-slug'), 'registry validation rejects malformed slugs');
truthy(malformedIssues.some((issue) => issue.code === 'invalid-status'), 'registry validation rejects unknown status values');
truthy(malformedIssues.some((issue) => issue.code === 'invalid-field'), 'registry validation rejects required metadata omissions');
const incompleteGuide = { ...contentRegistry.find((entry) => entry.kind === 'guide')!, id: 'incomplete-guide', sections: [null] } as unknown as CatalogEntry;
truthy(validateContentRegistry([incompleteGuide]).some((issue) => issue.code === 'invalid-content'), 'malformed guide sections are reported without throwing');
const incompleteTool = { ...wordCounter, id: 'incomplete-tool', slug: 'incomplete-tool', howItWorks: undefined, workedExample: undefined } as unknown as CatalogEntry;
truthy(validateContentRegistry([incompleteTool]).some((issue) => issue.code === 'invalid-content'), 'published tools with missing documentation are rejected without throwing');
let invalidPublishedExposureRejected = false;
try {
  getPublishedEntries([...contentRegistry, incompleteTool]);
} catch (error) {
  invalidPublishedExposureRejected = error instanceof Error && error.message.includes('Invalid NoCharge content registry');
}
truthy(invalidPublishedExposureRejected, 'published selectors fail closed rather than exposing an entry that fails publication gates');
truthy(validateContentRegistry([null as unknown as CatalogEntry]).some((issue) => issue.code === 'invalid-field'), 'non-object registry records are reported without throwing');

console.log('Content registry tests passed (publication gates, unique word counts, metadata, links, search, and prerender selectors).');
