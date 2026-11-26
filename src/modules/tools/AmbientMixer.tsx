import { useEffect, useRef, useState } from 'react';
import './Phase3BTools.css';

type Scene = 'meadow' | 'stream' | 'night' | 'soft-tones';
type AudioGraph = { context: AudioContext; master: GainNode; nodes: AudioScheduledSourceNode[] };
const scenes: { id: Scene; label: string; description: string }[] = [
  { id: 'meadow', label: 'Meadow air', description: 'Soft filtered noise with two quiet, sustained tones.' },
  { id: 'stream', label: 'Flowing stream', description: 'A brighter filtered-noise texture with a slow low tone.' },
  { id: 'night', label: 'Night field', description: 'A low noise bed and sparse, steady oscillator tones.' },
  { id: 'soft-tones', label: 'Soft tones', description: 'A small chord made from slowly detuned sine waves.' },
];

function selectedFromUrl(): { scene: Scene; volume: number } {
  if (typeof window === 'undefined') return { scene: 'meadow', volume: 24 };
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('scene');
  const requestedVolume = params.get('vol');
  const volume = requestedVolume === null ? Number.NaN : Number(requestedVolume);
  return {
    scene: scenes.some((item) => item.id === requested) ? requested as Scene : 'meadow',
    volume: Number.isFinite(volume) && volume >= 0 && volume <= 100 ? volume : 24,
  };
}

function createContext(): AudioContext {
  const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Constructor) throw new Error('This browser does not provide the Web Audio API.');
  return new Constructor();
}

function addNoise(context: AudioContext, master: GainNode, nodes: AudioScheduledSourceNode[], color: 'low' | 'bright') {
  const length = Math.max(1, Math.floor(context.sampleRate * 1.5));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.23;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = color === 'low' ? 'lowpass' : 'bandpass';
  filter.frequency.value = color === 'low' ? 560 : 1250;
  filter.Q.value = 0.45;
  const level = context.createGain();
  level.gain.value = 0.42;
  source.connect(filter);
  filter.connect(level);
  level.connect(master);
  source.start();
  nodes.push(source);
}

function addTone(context: AudioContext, master: GainNode, nodes: AudioScheduledSourceNode[], frequency: number, waveform: OscillatorType, gain = 0.08) {
  const oscillator = context.createOscillator();
  const level = context.createGain();
  oscillator.type = waveform;
  oscillator.frequency.value = frequency;
  level.gain.value = gain;
  oscillator.connect(level);
  level.connect(master);
  oscillator.start();
  nodes.push(oscillator);
}

function buildScene(context: AudioContext, master: GainNode, nodes: AudioScheduledSourceNode[], scene: Scene) {
  if (scene === 'meadow') {
    addNoise(context, master, nodes, 'low');
    addTone(context, master, nodes, 174.61, 'sine', 0.055);
    addTone(context, master, nodes, 261.63, 'sine', 0.035);
  } else if (scene === 'stream') {
    addNoise(context, master, nodes, 'bright');
    addTone(context, master, nodes, 130.81, 'triangle', 0.045);
  } else if (scene === 'night') {
    addNoise(context, master, nodes, 'low');
    addTone(context, master, nodes, 110, 'sine', 0.055);
    addTone(context, master, nodes, 164.81, 'sine', 0.035);
  } else {
    addTone(context, master, nodes, 130.81, 'sine', 0.065);
    addTone(context, master, nodes, 164.81, 'sine', 0.045);
    addTone(context, master, nodes, 196, 'sine', 0.035);
  }
}

export default function AmbientMixer() {
  const initial = selectedFromUrl();
  const [scene, setScene] = useState<Scene>(initial.scene);
  const [volume, setVolume] = useState(initial.volume);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('Stopped. Choose a scene and press Play to create audio.');
  const graphRef = useRef<AudioGraph | null>(null);
  const activeRef = useRef(false);
  const resumeAfterHidden = useRef(false);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const stopAudio = (announce = true) => {
    const graph = graphRef.current;
    graphRef.current = null;
    activeRef.current = false;
    resumeAfterHidden.current = false;
    if (graph) {
      for (const node of graph.nodes) {
        try { node.stop(); } catch { /* A source may already have ended. */ }
        try { node.disconnect(); } catch { /* Disconnect is best-effort cleanup. */ }
      }
      graph.master.disconnect();
      void graph.context.close().catch(() => undefined);
    }
    setPlaying(false);
    if (announce) setStatus('Stopped. No sound is being generated.');
  };

  const startAudio = async (nextScene: Scene, nextVolume = volume) => {
    stopAudio(false);
    let context: AudioContext | null = null;
    const nodes: AudioScheduledSourceNode[] = [];
    let master: GainNode | null = null;
    try {
      context = createContext();
      master = context.createGain();
      master.gain.value = (nextVolume / 100) * 0.22;
      master.connect(context.destination);
      buildScene(context, master, nodes, nextScene);
      await context.resume();
      graphRef.current = { context, master, nodes };
      activeRef.current = true;
      setPlaying(true);
      setStatus(`${scenes.find((item) => item.id === nextScene)?.label ?? 'Scene'} playing at ${nextVolume} percent volume.`);
    } catch (error) {
      for (const node of nodes) {
        try { node.stop(); } catch { /* A partially created source may not have started. */ }
      }
      master?.disconnect();
      if (context) void context.close().catch(() => undefined);
      setPlaying(false);
      activeRef.current = false;
      const message = error instanceof Error ? error.message : 'The audio graph could not start.';
      setStatus(`Audio unavailable: ${message} Choose Stop or try again after a user gesture.`);
    }
  };

  useEffect(() => {
    const onVisibility = () => {
      const graph = graphRef.current;
      if (!graph) return;
      if (document.visibilityState === 'hidden') {
        resumeAfterHidden.current = activeRef.current;
        if (activeRef.current) {
          void graph.context.suspend().then(() => setStatus('Paused while this page is hidden.')).catch(() => setStatus('Audio paused because the page became hidden.'));
        }
      } else if (resumeAfterHidden.current && graphRef.current === graph) {
        resumeAfterHidden.current = false;
        void graph.context.resume().then(() => setStatus(`${scenes.find((item) => item.id === sceneRef.current)?.label ?? 'Scene'} resumed after the page became visible.`)).catch(() => {
          setStatus('Audio did not resume automatically. Press Play to start it again.');
          setPlaying(false);
          activeRef.current = false;
        });
      }
    };
    const onPageHide = () => stopAudio(false);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      stopAudio(false);
    };
  }, []);

  const changeVolume = (next: number) => {
    setVolume(next);
    const graph = graphRef.current;
    if (graph) graph.master.gain.setTargetAtTime((next / 100) * 0.22, graph.context.currentTime, 0.06);
    if (activeRef.current) setStatus(`${scenes.find((item) => item.id === scene)?.label ?? 'Scene'} playing at ${next} percent volume.`);
  };
  const changeScene = (next: Scene) => {
    setScene(next);
    if (activeRef.current) void startAudio(next);
  };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">These four textures are synthesized in this page with the Web Audio API. Playback begins only after you press Play; no audio file, recording, or server stream is loaded.</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Soundscape
          <select aria-label="Soundscape" value={scene} onChange={(event) => changeScene(event.target.value as Scene)}>
            {scenes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="phase3b-tool__field">Volume <output>{volume}%</output>
          <input aria-label="Soundscape volume" type="range" min="0" max="100" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} />
        </label>
      </div>
      <p className="phase3b-tool__note">{scenes.find((item) => item.id === scene)?.description}</p>
      <div className="phase3b-tool__actions">
        <button className="button button--primary" type="button" onClick={() => void startAudio(scene)} disabled={playing}>Play soundscape</button>
        <button className="button button--secondary" type="button" onClick={() => stopAudio()} disabled={!playing}>Stop</button>
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{status}</p>
      <p className="phase3b-tool__note">Changing the scene while it is playing restarts the chosen sound after the selection gesture. Hiding the tab suspends playback; leaving the page stops it. This tool writes no sound preference or selection to storage.</p>
    </div>
  );
}
