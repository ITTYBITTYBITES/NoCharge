import { normalizeAmbientName, readAmbientPreference, writeAmbientPreference, type AmbientName } from './catalog';
import { getSharedAudioGraph, resumeSharedAudioGraph, setMasterGain, setSharedMasterMuted, type SharedAudioGraph } from './engine';
import { isAudioUnlocked } from './playback-state';
import { isMuted, getSoundVolume } from './preferences';
import { ProceduralSoundscape } from './ambient-voices';
import { clamp, smoothRamp } from './utils';

export { AMBIENT_CATALOG, AMBIENT_NAMES, getAmbientCatalogEntry, isAmbientName } from './catalog';
export type { AmbientCatalogEntry, AmbientName } from './catalog';

export const AMBIENT_CROSSFADE_SECONDS = 1.05;
const AMBIENT_BUS_LEVEL = 0.58;

class AmbientController {
  private graph: SharedAudioGraph | null = null;
  private current: ProceduralSoundscape | null = null;
  private active: AmbientName = 'none';
  private suspended: AmbientName = 'none';
  private ducked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('nocharge:mastermutechange', this.onMasterMuteChange as EventListener);
    }
  }

  private readonly onMasterMuteChange = (event: Event): void => {
    const detail = (event as CustomEvent<{ muted?: boolean }>).detail;
    if (detail?.muted) {
      this.suspended = 'none';
      this.stopInternal(false);
    }
    setSharedMasterMuted(!!detail?.muted);
  };

  getActive(): AmbientName {
    return this.active;
  }

  start(name: AmbientName): AmbientName {
    const selected = normalizeAmbientName(name);
    this.suspended = 'none';
    if (selected === 'none' || isMuted() || !isAudioUnlocked()) {
      this.stopInternal(false);
      return 'none';
    }

    const graph = getSharedAudioGraph();
    if (!graph) return 'none';
    this.graph = graph;
    void resumeSharedAudioGraph().catch(() => undefined);

    if (this.current && this.active === selected) {
      this.updateVolume();
      return selected;
    }

    const previous = this.current;
    if (previous) previous.stop(AMBIENT_CROSSFADE_SECONDS);

    let next: ProceduralSoundscape | null = null;
    try {
      next = new ProceduralSoundscape(graph.context, selected);
      next.start();
      next.output.connect(graph.ambientBus);
      next.fadeTo(1, AMBIENT_CROSSFADE_SECONDS);
    } catch {
      try { next?.dispose(); } catch { /* construction can fail in a partial Web Audio shim */ }
      this.current = null;
      this.active = 'none';
      return 'none';
    }

    this.current = next;
    this.active = selected;
    this.updateVolume();
    return selected;
  }

  stop(): void {
    this.suspended = 'none';
    this.stopInternal(false);
  }

  suspendForVisibility(): boolean {
    if (this.active === 'none' || !this.current) return false;
    this.suspended = this.active;
    this.stopInternal(false);
    return true;
  }

  resumeAfterVisibility(): AmbientName {
    const previous = this.suspended;
    this.suspended = 'none';
    if (previous === 'none' || getAmbient() === 'none' || isMuted() || !isAudioUnlocked()) return 'none';
    return this.start(getAmbient());
  }

  updateVolume(): void {
    if (!this.graph) return;
    const target = (getSoundVolume() / 100) * AMBIENT_BUS_LEVEL * (this.ducked ? 0.22 : 1);
    setMasterGain(this.graph, isMuted() ? 0 : 1, 0.08);
    const now = this.graph.context.currentTime;
    smoothRamp(this.graph.ambientBus.gain, clamp(target, 0, AMBIENT_BUS_LEVEL), now, 0.08);
  }

  duck(value = true): void {
    this.ducked = value;
    this.updateVolume();
  }

  private stopInternal(clearSuspended: boolean): void {
    if (clearSuspended) this.suspended = 'none';
    const previous = this.current;
    this.current = null;
    this.active = 'none';
    if (previous) previous.stop(AMBIENT_CROSSFADE_SECONDS);
    if (this.graph) {
      const now = this.graph.context.currentTime;
      smoothRamp(this.graph.ambientBus.gain, 0.0001, now, AMBIENT_CROSSFADE_SECONDS);
    }
  }
}

let controller: AmbientController | null = null;

function getController(): AmbientController {
  return (controller ??= new AmbientController());
}

export function getAmbient(): AmbientName {
  return readAmbientPreference();
}

export function setAmbient(name: AmbientName): void {
  writeAmbientPreference(name);
}

export function getActiveAmbient(): AmbientName {
  return controller?.getActive() ?? 'none';
}

export function startAmbient(name: AmbientName = getAmbient()): AmbientName {
  return getController().start(normalizeAmbientName(name));
}

export function stopAmbient(): void {
  controller?.stop();
}

export function suspendAmbientForVisibility(): boolean {
  return controller?.suspendForVisibility() ?? false;
}

export function resumeAmbientAfterVisibility(): AmbientName {
  return controller?.resumeAfterVisibility() ?? 'none';
}

export function refreshAmbient(): AmbientName {
  const name = getAmbient();
  return name === 'none' ? (stopAmbient(), 'none') : startAmbient(name);
}

export function duckAmbient(ducked = true): void {
  controller?.duck(ducked);
}

export function updateAmbientVolume(): void {
  controller?.updateVolume();
}

/** Called by the shared effects facade when the persistent master mute changes. */
export function setAmbientMasterMuted(value: boolean): void {
  setSharedMasterMuted(value);
  if (value) controller?.stop();
}
