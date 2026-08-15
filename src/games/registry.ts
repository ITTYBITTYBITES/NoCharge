import { mountMemoryMatch } from './memory-match/main';
import { mountWordTileRush } from './word-tile-rush/main';
import { mountColorFlip } from './color-flip/main';

export interface GameModule {
  mount(root: HTMLElement): () => void;
}

const registry: Record<string, GameModule> = {
  'memory-match': { mount: mountMemoryMatch },
  'word-tile-rush': { mount: mountWordTileRush },
  'color-flip': { mount: mountColorFlip },
};

export function mountGame(id: string, root: HTMLElement) {
  return registry[id]?.mount(root) ?? (() => {});
}
