import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { h5GamesAdsAdapter } from '../../integrations/advertising';
import type {
  ArcadeBreakEvent,
  ArcadeBreakPoint,
  ArcadeGameRuntime,
  ArcadePauseReason,
} from '../../content/schemas';
import { ArcadeRuntimeCoordinator } from './runtime';

interface ArcadeRuntimeContextValue {
  register(runtime: ArcadeGameRuntime): () => void;
  start(): void;
  requestBreak(point: ArcadeBreakPoint, event: ArcadeBreakEvent): Promise<void>;
}

export interface ArcadeGameRuntimeHandle extends ArcadeGameRuntime {
  /** Requests the coordinator to dispatch the lifecycle start action when unpaused. */
  begin(): void;
}

const ArcadeRuntimeContext = createContext<ArcadeRuntimeContextValue | null>(null);

export function ArcadeRuntimeProvider({
  contentId,
  allowedBreakpoints,
  children,
}: PropsWithChildren<{
  contentId: string;
  allowedBreakpoints: readonly ArcadeBreakPoint[];
}>) {
  const [paused, setPaused] = useState(false);
  const [lastBreakpoint, setLastBreakpoint] = useState<ArcadeBreakPoint | 'none'>('none');
  const coordinatorRef = useRef<ArcadeRuntimeCoordinator | null>(null);
  if (!coordinatorRef.current) {
    coordinatorRef.current = new ArcadeRuntimeCoordinator({
      contentId,
      allowedBreakpoints,
      adapter: h5GamesAdsAdapter,
      onBreakpoint: setLastBreakpoint,
      onPauseStateChange: setPaused,
    });
  }
  const coordinator = coordinatorRef.current;
  const effectGeneration = useRef(0);
  const register = useCallback((runtime: ArcadeGameRuntime) => coordinator.register(runtime), [coordinator]);
  const start = useCallback(() => coordinator.start(), [coordinator]);
  const requestBreak = useCallback(async (point: ArcadeBreakPoint, event: ArcadeBreakEvent) => {
    await coordinator.requestBreak(point, event);
  }, [coordinator]);
  const contextValue = useMemo(() => ({ register, start, requestBreak }), [register, start, requestBreak]);

  useEffect(() => {
    const generation = ++effectGeneration.current;
    const syncVisibility = () => coordinator.setPauseReason('hidden', document.visibilityState !== 'visible');
    const onBlur = () => coordinator.setPauseReason('blur', true);
    const onFocus = () => coordinator.setPauseReason('blur', false);

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      // React StrictMode replays effects on mount in development. Defer disposal
      // one microtask so the replay setup can supersede this cleanup.
      queueMicrotask(() => {
        if (effectGeneration.current === generation) coordinator.dispose();
      });
    };
  }, [coordinator]);

  return (
    <ArcadeRuntimeContext.Provider value={contextValue}>
      <div
        className="arcade-runtime-provider"
        data-arcade-runtime-contract="nocharge-arcade-v1"
        data-arcade-paused={String(paused)}
        data-h5-last-breakpoint={lastBreakpoint}
      >
        {children}
      </div>
    </ArcadeRuntimeContext.Provider>
  );
}

/**
 * Registers the game's own lifecycle actions with the page-level coordinator.
 * The two natural-end methods are wired directly to the dormant H5 adapter;
 * ordinary moves, playback ticks, and handoffs have no path to that adapter.
 */
export function useArcadeGameRuntime(
  actions: Pick<ArcadeGameRuntime, 'init' | 'start' | 'pause' | 'resume' | 'destroy'>,
): ArcadeGameRuntimeHandle {
  const context = useContext(ArcadeRuntimeContext);
  if (!context) throw new Error('Arcade game modules must be mounted inside ArcadeRuntimeProvider.');

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const runtime = useMemo<ArcadeGameRuntime>(() => ({
    init: () => actionsRef.current.init(),
    start: () => actionsRef.current.start(),
    pause: (reason: ArcadePauseReason) => actionsRef.current.pause(reason),
    resume: () => actionsRef.current.resume(),
    destroy: () => actionsRef.current.destroy(),
    onRoundEnd: (event) => context.requestBreak('round-end', event),
    onGameOver: (event) => context.requestBreak('game-over', event),
  }), [context]);

  useEffect(() => context.register(runtime), [context, runtime]);
  const begin = useCallback(() => context.start(), [context]);
  return useMemo(() => ({ ...runtime, begin }), [runtime, begin]);
}
