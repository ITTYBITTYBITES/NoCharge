export type PauseReason = 'player' | 'hidden' | 'consent' | 'fullscreen-change';

/**
 * Every game exposes the same small lifecycle surface. The page shell owns
 * shared controls and automatic pauses; individual games only preserve and
 * resume their own state.
 */
export interface GameController {
  destroy(): void;
  pause(reason?: PauseReason): void;
  resume(): void;
  isPaused(): boolean;
  restart?(): void;
}
