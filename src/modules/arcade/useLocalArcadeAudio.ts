import { useCallback, useRef, useState } from 'react';

/** Opt-in, locally synthesized tones shared by the clean-room Arcade modules. */
export function useLocalArcadeAudio() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef(new Set<OscillatorNode>());

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
    try {
      contextRef.current ??= new window.AudioContext();
      return contextRef.current;
    } catch {
      return null;
    }
  }, []);

  const stopTones = useCallback(() => {
    for (const oscillator of oscillatorsRef.current) {
      try { oscillator.stop(); } catch { /* The tone may already have ended. */ }
      try { oscillator.disconnect(); } catch { /* Already disconnected. */ }
    }
    oscillatorsRef.current.clear();
  }, []);

  const toggle = useCallback(() => {
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      stopTones();
      if (contextRef.current?.state === 'running') void contextRef.current.suspend().catch(() => {});
      return;
    }
    const context = getContext();
    if (!context) return;
    enabledRef.current = true;
    setEnabled(true);
    void context.resume().catch(() => {});
  }, [getContext, stopTones]);

  const play = useCallback((frequency = 440) => {
    if (!enabledRef.current) return;
    const context = getContext();
    if (!context) return;
    void context.resume().catch(() => {});
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillatorsRef.current.add(oscillator);
    oscillator.onended = () => {
      oscillatorsRef.current.delete(oscillator);
      try { oscillator.disconnect(); } catch { /* Already disconnected. */ }
      try { gain.disconnect(); } catch { /* Already disconnected. */ }
    };
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  }, [getContext]);

  const pause = useCallback(() => {
    if (contextRef.current?.state === 'running') void contextRef.current.suspend().catch(() => {});
  }, []);

  const resume = useCallback(() => {
    if (enabledRef.current && contextRef.current?.state === 'suspended') {
      void contextRef.current.resume().catch(() => {});
    }
  }, []);

  const destroy = useCallback(() => {
    stopTones();
    const context = contextRef.current;
    contextRef.current = null;
    enabledRef.current = false;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }, [stopTones]);

  return { enabled, toggle, play, pause, resume, destroy };
}
