/**
 * Why a game is paused.
 *
 * `ad` is reserved for the Lab section's full-screen ad playback. It is in the
 * shared union rather than a Lab-local type because the shared shell is the
 * thing that renders the pause state, and a Lab prototype paused by an ad must
 * look exactly like a Quiet Arcade game paused by the consent dialog.
 */
export type PauseReason = 'player' | 'hidden' | 'consent' | 'fullscreen-change' | 'ad';

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
