import type {
  H5GameAdBreakRequest,
  H5GameAdBreakResult,
  H5GamesAdsAdapter,
} from '../../integrations/advertising';
import type {
  ArcadeBreakEvent,
  ArcadeBreakPoint,
  ArcadeGameRuntime,
  ArcadePauseReason,
} from '../../content/schemas';

export interface ArcadeRuntimeAdapter {
  requestBreak(request: H5GameAdBreakRequest): Promise<H5GameAdBreakResult>;
}

export interface ArcadeRuntimeCoordinatorOptions {
  contentId: string;
  allowedBreakpoints: readonly ArcadeBreakPoint[];
  adapter: ArcadeRuntimeAdapter | Pick<H5GamesAdsAdapter, 'requestBreak'>;
  onBreakpoint?: (point: ArcadeBreakPoint) => void;
  onPauseStateChange?: (paused: boolean) => void;
}

/**
 * Owns one mounted game's lifecycle and mediates its natural break callbacks.
 * The adapter's inactive implementation resolves immediately and never runs
 * the before/after callbacks. Visibility and blur pauses are tracked separately
 * so clearing one reason cannot resume a game that is still paused for another.
 */
export class ArcadeRuntimeCoordinator {
  private runtime: ArcadeGameRuntime | null = null;
  private readonly pauseReasons = new Set<ArcadePauseReason>();
  private disposed = false;

  constructor(private readonly options: ArcadeRuntimeCoordinatorOptions) {}

  register(runtime: ArcadeGameRuntime): () => void {
    if (this.disposed) throw new Error('Cannot register a game with a disposed Arcade runtime.');
    if (this.runtime && this.runtime !== runtime) this.unregister(this.runtime);

    this.runtime = runtime;
    runtime.init();
    const existingReason = this.pauseReasons.values().next().value as ArcadePauseReason | undefined;
    if (existingReason) runtime.pause(existingReason);
    this.notifyPauseState();

    return () => this.unregister(runtime);
  }

  start(): void {
    if (this.disposed || this.pauseReasons.size > 0) return;
    this.runtime?.start();
  }

  setPauseReason(reason: ArcadePauseReason, active: boolean): void {
    if (this.disposed) return;
    const wasPaused = this.pauseReasons.size > 0;
    if (active) this.pauseReasons.add(reason);
    else this.pauseReasons.delete(reason);
    const isPaused = this.pauseReasons.size > 0;

    if (!wasPaused && isPaused) this.runtime?.pause(reason);
    else if (wasPaused && !isPaused) this.runtime?.resume();
    this.notifyPauseState();
  }

  requestBreak(point: ArcadeBreakPoint, event: ArcadeBreakEvent): Promise<H5GameAdBreakResult> {
    if (this.disposed || !this.options.allowedBreakpoints.includes(point)) {
      return Promise.resolve({ status: 'inactive', type: 'next' });
    }

    this.options.onBreakpoint?.(point);
    const request: H5GameAdBreakRequest = {
      type: 'next',
      name: `${this.options.contentId}:${point}:${event.outcome}:round-${event.round}`,
      onBeforeAd: () => this.setPauseReason('ad-break', true),
      onAfterAd: () => this.setPauseReason('ad-break', false),
      // Rewarded inventory is not used by Arcade lifecycle callbacks.
      onAdDismissed: () => {},
      onBreakDone: () => {},
    };
    return this.options.adapter.requestBreak(request);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const runtime = this.runtime;
    this.runtime = null;
    this.pauseReasons.clear();
    runtime?.destroy();
  }

  private unregister(runtime: ArcadeGameRuntime): void {
    if (this.runtime !== runtime) return;
    this.runtime = null;
    runtime.destroy();
    if (!this.disposed) this.notifyPauseState();
  }

  private notifyPauseState(): void {
    this.options.onPauseStateChange?.(this.pauseReasons.size > 0);
  }
}
