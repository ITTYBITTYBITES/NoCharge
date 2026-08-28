import type { GameController } from './shared/types';

export interface GameModule {
  mount(root: HTMLElement): GameController;
}

type GameLoader = () => Promise<GameModule>;

/**
 * Route-level loaders keep each game's JavaScript and CSS in its own Vite
 * chunk. A visitor downloads the shared shell plus only the game they open.
 */
const registry: Record<string, GameLoader> = {
  'memory-match': async () => ({ mount: (await import('./memory-match/main')).mountMemoryMatch }),
  'word-tile-rush': async () => ({ mount: (await import('./word-tile-rush/main')).mountWordTileRush }),
  'color-flip': async () => ({ mount: (await import('./color-flip/main')).mountColorFlip }),
  'beacon-lattice': async () => ({ mount: (await import('./beacon-lattice/main')).mountBeaconLattice }),
  'tic-tac-toe': async () => ({ mount: (await import('./tic-tac-toe/main')).mountTicTacToe }),
  'dots-and-boxes': async () => ({ mount: (await import('./dots-and-boxes/main')).mountDotsAndBoxes }),
  'four-in-a-row': async () => ({ mount: (await import('./four-in-a-row/main')).mountFourInARow }),
  reversi: async () => ({ mount: (await import('./reversi/main')).mountReversi }),
  'last-token': async () => ({ mount: (await import('./last-token/main')).mountLastToken }),
  'pass-the-picture': async () => ({ mount: (await import('./pass-the-picture/main')).mountPassThePicture }),
  klondike: async () => ({ mount: (await import('./klondike/main')).mountKlondike }),
  freecell: async () => ({ mount: (await import('./freecell/main')).mountFreeCell }),
  nonogram: async () => ({ mount: (await import('./nonogram/main')).mountNonogram }),
  'twenty-forty-eight': async () => ({ mount: (await import('./twenty-forty-eight/main')).mountTwentyFortyEight }),
  'tile-garden': async () => ({ mount: (await import('./tile-garden/main')).mountTileGarden }),
  'word-search': async () => ({ mount: (await import('./word-search/main')).mountWordSearch }),
  'mini-sudoku': async () => ({ mount: (await import('./mini-sudoku/main')).mountMiniSudoku }),
  minesweeper: async () => ({ mount: (await import('./minesweeper/main')).mountMinesweeper }),
  hangman: async () => ({ mount: (await import('./hangman/main')).mountHangman }),
  'lights-out': async () => ({ mount: (await import('./lights-out/main')).mountLightsOut }),
  simon: async () => ({ mount: (await import('./simon/main')).mountSimon }),
  'sudoku-9x9': async () => ({ mount: (await import('./sudoku-9x9/main')).mountSudoku9x9 }),
  gomoku: async () => ({ mount: (await import('./gomoku/main')).mountGomoku }),
  'nine-mens-morris': async () => ({ mount: (await import('./nine-mens-morris/main')).mountNineMensMorris }),
  'word-loom': async () => ({ mount: (await import('./word-loom/main')).mountWordLoom }),
  checkers: async () => ({ mount: (await import('./checkers/main')).mountCheckers }),
};

export function emptyGameController(): GameController {
  return {
    destroy() {},
    pause() {},
    resume() {},
    isPaused: () => false,
  };
}

export async function mountGame(id: string, root: HTMLElement): Promise<GameController> {
  const load = registry[id];
  if (!load) {
    root.textContent = 'This game is not available.';
    return emptyGameController();
  }

  try {
    const module = await load();
    return module.mount(root);
  } catch (error) {
    console.error(`Unable to mount game "${id}".`, error);
    root.textContent = 'This game could not start. Reload the page and try again.';
    return emptyGameController();
  }
}

export type { GameController, PauseReason } from './shared/types';
