import { mountBeaconLattice } from './beacon-lattice/main';
import { mountMemoryMatch } from './memory-match/main';
import { mountWordTileRush } from './word-tile-rush/main';
import { mountColorFlip } from './color-flip/main';
import type { GameController } from './shared/types';

export interface GameModule {
  mount(root: HTMLElement): GameController;
}

const registry: Record<string, GameModule> = {
  'memory-match': { mount: mountMemoryMatch },
  'word-tile-rush': { mount: mountWordTileRush },
  'color-flip': { mount: mountColorFlip },
  'beacon-lattice': { mount: mountBeaconLattice },
};

export function mountGame(id: string, root: HTMLElement): GameController {
  return (
    registry[id]?.mount(root) ?? {
      destroy() {},
      pause() {},
      resume() {},
      isPaused: () => false,
    }
  );
}

export type { GameController, PauseReason } from './shared/types';
