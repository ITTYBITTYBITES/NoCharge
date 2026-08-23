import { mountBeaconLattice } from './beacon-lattice/main';
import { mountMemoryMatch } from './memory-match/main';
import { mountWordTileRush } from './word-tile-rush/main';
import { mountColorFlip } from './color-flip/main';
import { mountTicTacToe } from './tic-tac-toe/main';
import { mountDotsAndBoxes } from './dots-and-boxes/main';
import { mountFourInARow } from './four-in-a-row/main';
import { mountReversi } from './reversi/main';
import { mountLastToken } from './last-token/main';
import { mountPassThePicture } from './pass-the-picture/main';
import { mountKlondike } from './klondike/main';
import { mountFreeCell } from './freecell/main';
import { mountNonogram } from './nonogram/main';
import { mountTwentyFortyEight } from './twenty-forty-eight/main';
import { mountTileGarden } from './tile-garden/main';
import { mountWordSearch } from './word-search/main';
import { mountMiniSudoku } from './mini-sudoku/main';
import type { GameController } from './shared/types';

export interface GameModule {
  mount(root: HTMLElement): GameController;
}

const registry: Record<string, GameModule> = {
  'memory-match': { mount: mountMemoryMatch },
  'word-tile-rush': { mount: mountWordTileRush },
  'color-flip': { mount: mountColorFlip },
  'beacon-lattice': { mount: mountBeaconLattice },
  'tic-tac-toe': { mount: mountTicTacToe },
  'dots-and-boxes': { mount: mountDotsAndBoxes },
  'four-in-a-row': { mount: mountFourInARow },
  reversi: { mount: mountReversi },
  'last-token': { mount: mountLastToken },
  'pass-the-picture': { mount: mountPassThePicture },
  klondike: { mount: mountKlondike },
  freecell: { mount: mountFreeCell },
  nonogram: { mount: mountNonogram },
  'twenty-forty-eight': { mount: mountTwentyFortyEight },
  'tile-garden': { mount: mountTileGarden },
  'word-search': { mount: mountWordSearch },
  'mini-sudoku': { mount: mountMiniSudoku },
};

export function mountGame(id: string, root: HTMLElement): GameController {
  const empty = {
    destroy() {},
    pause() {},
    resume() {},
    isPaused: () => false,
  };
  try {
    return registry[id]?.mount(root) ?? empty;
  } catch (error) {
    root.textContent = error instanceof Error ? error.message : String(error);
    return empty;
  }
}

export type { GameController, PauseReason } from './shared/types';
