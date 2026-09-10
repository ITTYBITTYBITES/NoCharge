/**
 * Lab prototype registry.
 *
 * A separate registry from `src/games/registry.ts` on purpose. Keeping them
 * apart means Lab entries cannot leak into the Quiet Arcade's arcade listing,
 * Recently Played, search index, or `allFacts()` catalog — and calm pages cannot
 * pull Lab code into their bundles.
 *
 * Prototypes still implement the shared `GameController` contract, so the
 * regular shell's pause, sound, and fullscreen behaviour applies unchanged.
 */

import type { GameController } from '../games/shared/types';

export interface LabModule {
  mount(root: HTMLElement): GameController;
}

type LabLoader = () => Promise<LabModule>;

/** Route-level loaders keep each prototype's JS and CSS in its own chunk. */
const registry: Record<string, LabLoader> = {
  'pulse-runner': async () => ({
    mount: (await import('./prototypes/pulse-runner/main')).mountPulseRunner,
  }),
};

export function emptyLabController(): GameController {
  return {
    destroy() {},
    pause() {},
    resume() {},
    isPaused: () => false,
  };
}

export function listLabPrototypes(): string[] {
  return Object.keys(registry).sort();
}

export async function mountLabPrototype(id: string, root: HTMLElement): Promise<GameController> {
  const load = registry[id];
  if (!load) {
    root.textContent = 'This prototype is not available.';
    return emptyLabController();
  }
  try {
    const module = await load();
    return module.mount(root);
  } catch (error) {
    console.error(`Unable to mount prototype "${id}".`, error);
    root.textContent = 'This prototype could not start. Reload the page and try again.';
    return emptyLabController();
  }
}
