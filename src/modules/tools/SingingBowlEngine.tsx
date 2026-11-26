import { useEffect, useRef, useState } from 'react';
import './Phase3BTools.css';

type Material = 'bronze' | 'quartz';
type Bowl = { id: number; frequency: number; material: Material };
const presets: Record<string, number[]> = {
  pentatonic: [261.63, 293.66, 329.63, 392, 440],
  solfeggio: [396, 417, 528, 639, 741, 852],
  chakra: [256, 288, 320, 341, 384, 427, 480],
};
const ratios: Record<Material, number[]> = { bronze: [1, 2.76, 5.18], quartz: [1, 2, 3.01] };

function readHash(): Bowl[] {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#tones=')) return [];
  try {
    const raw = decodeURIComponent(window.location.hash.slice(7));
    return raw.split(';').slice(0, 16).flatMap((row, index) => {
      const [freqText, materialText] = row.split(',');
      const frequency = Number(freqText);
      if (!Number.isFinite(frequency) || frequency < 100 || frequency > 880) return [];
      const material: Material = materialText === 'quartz' ? 'quartz' : 'bronze';
      return [{ id: index + 1, frequency: Math.round(frequency), material }];
    });
  } catch {
    return [];
  }
}

function contextConstructor(): typeof AudioContext {
  const constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!constructor) throw new Error('Web Audio is not available in this browser.');
  return constructor;
}

export default function SingingBowlEngine() {
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState(440);
  const [material, setMaterial] = useState<Material>('bronze');
  const [volume, setVolume] = useState(28);
  const [status, setStatus] = useState('Add a bowl, then strike it. Audio starts only from a button press.');
  const [shareUrl, setShareUrl] = useState('');
  const audioRef = useRef<AudioContext | null>(null);
  const active = bowls.find((bowl) => bowl.id === selectedId);

  const saveArrangement = (next: Bowl[]) => {
    setBowls(next);
    if (typeof window !== 'undefined') {
      const encoded = next.map((bowl) => `${bowl.frequency},${bowl.material}`).join(';');
      const hash = encoded ? `#tones=${encodeURIComponent(encoded)}` : '';
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
      setShareUrl('');
    }
  };

  const strike = async (bowl: Bowl) => {
    try {
      const Constructor = contextConstructor();
      const context = audioRef.current ?? new Constructor();
      audioRef.current = context;
      if (context.state === 'suspended') await context.resume();
      const now = context.currentTime;
      const voice = context.createGain();
      const level = Math.max(0.0001, (volume / 100) * 0.18);
      voice.gain.setValueAtTime(0.0001, now);
      voice.gain.exponentialRampToValueAtTime(level, now + 0.018);
      voice.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      voice.connect(context.destination);
      const partials = ratios[bowl.material];
      partials.forEach((ratio, index) => {
        const oscillator = context.createOscillator();
        const partial = context.createGain();
        oscillator.type = bowl.material === 'quartz' ? 'sine' : index === 1 ? 'triangle' : 'sine';
        oscillator.frequency.value = bowl.frequency * ratio;
        partial.gain.value = [1, 0.27, 0.1][index] ?? 0.05;
        oscillator.connect(partial);
        partial.connect(voice);
        oscillator.start(now);
        oscillator.stop(now + 2.5);
      });
      setStatus(`${bowl.material} tone struck at ${bowl.frequency} hertz. The sound will fade automatically.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The audio tone could not start.';
      setStatus(`Audio unavailable: ${message} You can still tune and share the arrangement.`);
    }
  };

  const addBowl = () => {
    if (bowls.length >= 16) {
      setStatus('The arrangement is limited to 16 bowls so its share link stays manageable. Remove one before adding another.');
      return;
    }
    const id = bowls.reduce((largest, bowl) => Math.max(largest, bowl.id), 0) + 1;
    const bowl = { id, frequency: Math.round(frequency), material };
    const next = [...bowls, bowl];
    saveArrangement(next);
    setSelectedId(id);
    setStatus(`Added ${material} bowl ${id} at ${bowl.frequency} hertz.`);
  };

  const tune = (nextFrequency: number) => {
    const bounded = Math.max(100, Math.min(880, Math.round(nextFrequency)));
    setFrequency(bounded);
    if (active) {
      const next = bowls.map((bowl) => bowl.id === active.id ? { ...bowl, frequency: bounded } : bowl);
      saveArrangement(next);
      setStatus(`Selected bowl tuned to ${bounded} hertz. Strike it to preview the pitch.`);
    }
  };

  const loadPreset = (name: string) => {
    const freqs = presets[name];
    if (!freqs) return;
    const next = freqs.slice(0, 16).map((value, index) => ({ id: index + 1, frequency: Math.round(value), material: index % 2 ? 'bronze' as const : 'quartz' as const }));
    saveArrangement(next);
    setSelectedId(next[0]?.id ?? null);
    setFrequency(next[0]?.frequency ?? 440);
    setMaterial(next[0]?.material ?? 'bronze');
    setStatus(`${name} preset loaded with ${next.length} bowls. Press a Strike button to hear a tone.`);
  };

  useEffect(() => {
    // Read URL state after hydration so a share fragment cannot change the server-rendered markup.
    const initial = readHash();
    const first = initial[0];
    setBowls(initial);
    setSelectedId(first?.id ?? null);
    if (first) {
      setFrequency(first.frequency);
      setMaterial(first.material);
    }
    const onVisibility = () => {
      const context = audioRef.current;
      if (!context) return;
      if (document.visibilityState === 'hidden' && context.state === 'running') void context.suspend().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      const context = audioRef.current;
      audioRef.current = null;
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
    };
  }, []);

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Arrange a few pitched bowls, tune one from 100 to 880 Hz, and strike it on demand. This V2 instrument uses short oscillator envelopes and keeps its arrangement in the URL fragment rather than browser storage.</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Frequency <output>{active?.frequency ?? frequency} Hz</output>
          <input aria-label="Bowl frequency" type="range" min="100" max="880" step="1" value={active?.frequency ?? frequency} onChange={(event) => tune(Number(event.target.value))} />
        </label>
        <label className="phase3b-tool__field">Material profile
          <select aria-label="Bowl material" value={active?.material ?? material} onChange={(event) => {
            const nextMaterial = event.target.value as Material;
            setMaterial(nextMaterial);
            if (active) saveArrangement(bowls.map((bowl) => bowl.id === active.id ? { ...bowl, material: nextMaterial } : bowl));
          }}><option value="bronze">Bronze-like partials</option><option value="quartz">Quartz-like partials</option></select>
        </label>
        <label className="phase3b-tool__field">Harmonic preset
          <select aria-label="Harmonic preset" value="" onChange={(event) => loadPreset(event.target.value)}><option value="" disabled>Choose a preset</option><option value="pentatonic">Pentatonic</option><option value="solfeggio">Solfeggio reference tones</option><option value="chakra">Chakra reference tones</option></select>
        </label>
        <label className="phase3b-tool__field">Volume <output>{volume}%</output>
          <input aria-label="Bowl volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
        </label>
      </div>
      <div className="phase3b-tool__actions">
        <button className="button button--primary" type="button" onClick={addBowl} disabled={bowls.length >= 16}>Add bowl</button>
        <button className="button button--secondary" type="button" onClick={() => loadPreset('pentatonic')}>Load pentatonic set</button>
        <button className="button button--secondary" type="button" onClick={() => { saveArrangement([]); setSelectedId(null); setStatus('Arrangement cleared.'); }}>Clear arrangement</button>
        <button className="button button--secondary" type="button" onClick={() => {
          const url = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
          setShareUrl(url);
          setStatus('The share URL includes the current bowl frequencies and profiles.');
        }}>Show share URL</button>
      </div>
      {shareUrl && <label className="phase3b-tool__field">Shareable arrangement URL<input aria-label="Shareable arrangement URL" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label>}
      <p className="phase3b-tool__status" role="status" aria-live="polite">{status}</p>
      <ul className="phase3b-tool__bowl-list" aria-label="Bowl arrangement">
        {bowls.map((bowl) => <li className={`phase3b-tool__bowl-item${bowl.id === selectedId ? ' phase3b-tool__bowl-item--selected' : ''}`} key={bowl.id}>
          <button className="phase3b-tool__bowl-name button button--secondary" type="button" onClick={() => { setSelectedId(bowl.id); setFrequency(bowl.frequency); setMaterial(bowl.material); }} aria-pressed={bowl.id === selectedId}>
            Bowl {bowl.id}<small>{bowl.frequency} Hz · {bowl.material}</small>
          </button>
          <button className="button button--primary" type="button" onClick={() => void strike(bowl)}>Strike</button>
          <button className="button button--secondary" type="button" onClick={() => {
            const next = bowls.filter((item) => item.id !== bowl.id);
            saveArrangement(next);
            if (selectedId === bowl.id) setSelectedId(next[0]?.id ?? null);
            setStatus(`Removed bowl ${bowl.id}.`);
          }}>Remove</button>
        </li>)}
      </ul>
      <p className="phase3b-tool__note">The initial hash decoder ignores invalid or out-of-range rows and accepts at most 16 tones. Audio can be blocked by browser policy; the status reports failure, and the tuning and arrangement controls still work without it.</p>
    </div>
  );
}
