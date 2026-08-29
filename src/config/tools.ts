/**
 * A5 — Tools catalog.
 *
 * Single source of truth for the Tools hub: categories, order, and blurbs.
 * Tool pages live at `/tools/{slug}/` and follow the shared ToolPage template.
 * Every entry here must have a matching page; `npm run check:links` enforces it.
 */
export type ToolCategory = 'play' | 'audio' | 'accessibility' | 'setup' | 'learning';

export interface ToolEntry {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  usefulWhen: string;
}

export const TOOL_CATEGORIES: { id: ToolCategory; label: string; blurb: string }[] = [
  { id: 'play', label: 'Play', blurb: 'Choose, plan, and understand a NoCharge game before you open it.' },
  { id: 'audio', label: 'Audio', blurb: 'Local, continuously generated procedural soundscapes that never leave the device.' },
  { id: 'accessibility', label: 'Accessibility', blurb: 'Checks and explainers that use the same standards NoCharge targets.' },
  { id: 'setup', label: 'Setup helpers', blurb: 'Small calculators for the desk, screen, keyboard, and light around your device.' },
  { id: 'learning', label: 'Learning', blurb: 'Rule and scoring explainers tied to the games that use them.' },
];

export const TOOLS: ToolEntry[] = [
  {
    slug: 'discovery-wheel',
    title: 'Game Discovery Wheel',
    description: 'Filter the live arcade collection by time, documented input, pressure, and number of players. Results include direct play and guide links.',
    category: 'play',
    usefulWhen: 'you know the kind of session you want but not the game.',
  },
  {
    slug: 'game-finder',
    title: 'Game Finder quiz',
    description: 'Five answers (time, players, pace, input, kind) produce an alphabetical shortlist from the live catalog. Not a ranking.',
    category: 'play',
    usefulWhen: 'you want a short, guided choice instead of a filter panel.',
  },
  {
    slug: 'session-planner',
    title: 'Session planner',
    description: 'Turn the minutes you have into a shortlist of games and an estimated number of runs, filtered by players and input.',
    category: 'play',
    usefulWhen: 'you know the length of your break but not the game.',
  },
  {
    slug: 'random-activity',
    title: 'Random calm activity',
    description: 'One press returns a random NoCharge game, article, or tool — equal probability, no claims, nothing stored.',
    category: 'play',
    usefulWhen: 'you want a quiet pick without deliberating.',
  },
  {
    slug: 'ambient-mixer',
    title: 'Ambient Mixer',
    description: 'Try ten continuously generated calm nature and music soundscapes. Every signal is made with Web Audio; there are no recordings or music loops, and sound stops when the page is hidden.',
    category: 'audio',
    usefulWhen: 'you want to compare a low procedural soundscape with silence.',
  },
  {
    slug: 'singing-bowl-engine',
    title: 'Singing Bowl Engine',
    description: 'Place and strike singing bowls on an interactive canvas, circle a rim to sing a sustained drone, tune on touch, and load pentatonic, solfeggio, or chakra presets. Bronze and quartz additive synthesis with harmonic connection lines, organic pitch drift, and synthetic reverb. All audio is generated in the browser.',
    category: 'audio',
    usefulWhen: 'you want to explore consonant intervals, additive synthesis, and sustained rim singing hands-on.',
  },
  {
    slug: 'contrast-checker',
    title: 'Contrast checker',
    description: 'Compute WCAG contrast ratios for any two hex colors and compare the common Quiet Arcade palette pairs.',
    category: 'accessibility',
    usefulWhen: 'you are checking a board, text, or palette pair against AA thresholds.',
  },
  {
    slug: 'reduced-motion-tester',
    title: 'Reduced-motion preference tester',
    description: 'Read the live prefers-reduced-motion query, see its effect on a demo, and read exactly what NoCharge changes when it is on.',
    category: 'accessibility',
    usefulWhen: 'you want to verify the browser setting and what the site does about it.',
  },
  {
    slug: 'touch-target-checker',
    title: 'Touch target size checker',
    description: 'Draw and measure a target in CSS pixels against WCAG minimums and NoCharge’s generous defaults, including spacing.',
    category: 'accessibility',
    usefulWhen: 'you are sizing buttons or checking a board for comfortable one-thumb play.',
  },
  {
    slug: 'storage-inspector',
    title: 'LocalStorage inspector (read-only)',
    description: 'List NoCharge keys present in this browser with their purpose and owner. Never writes or deletes anything.',
    category: 'accessibility',
    usefulWhen: 'you want to know what this browser holds without opening DevTools.',
  },
  {
    slug: 'zoom-visualizer',
    title: 'Browser Zoom Viewport Calculator',
    description: 'Convert a starting viewport and browser zoom percentage into approximate CSS layout dimensions, then use that size for manual reflow testing.',
    category: 'setup',
    usefulWhen: 'preparing 200% or 400% browser-zoom checks.',
  },
  {
    slug: 'nonogram-clue-calculator',
    title: 'Nonogram clue calculator',
    description: 'Enumerate the arrangements of a nonogram line, mark cells forced in every one, and see the arithmetic — educational, not a solver.',
    category: 'learning',
    usefulWhen: 'you are learning to read nonogram runs or stuck on one row.',
  },
  {
    slug: 'solitaire-comparator',
    title: 'Solitaire rules comparator',
    description: 'Side-by-side rules for Klondike, FreeCell, and planned Spider: decks, draw, tableau, foundations, and planning style.',
    category: 'learning',
    usefulWhen: 'you want to pick a solitaire by rule differences rather than brand.',
  },
  {
    slug: 'sudoku-helper',
    title: 'Sudoku pencil-mark helper',
    description: 'See candidates for a selected cell and learn hidden-single logic. Non-spoiler by default; a labeled reveal is available if you choose it.',
    category: 'learning',
    usefulWhen: 'you are learning pencil marks or stuck on one cell.',
  },
  {
    slug: 'focus-order-demo',
    title: 'Focus order demo',
    description: 'Tab through a sample grid with visible focus and reading-order navigation, with the three checks keyboard users depend on.',
    category: 'accessibility',
    usefulWhen: 'you want to see what logical focus order means on a real control grid.',
  },
  {
    slug: 'word-scoring',
    title: 'Word length & scoring explainer',
    description: 'Compare linear and length-squared scoring curves, see the idea behind Word Tile Rush, and inspect the table of common lengths.',
    category: 'learning',
    usefulWhen: 'you want to understand why longer words score more.',
  },
];
