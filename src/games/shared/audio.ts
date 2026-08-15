type SoundName = 'pop' | 'blip' | 'win';

const FILES: Record<SoundName, string> = {
  pop: '/game-assets/pop.wav',
  blip: '/game-assets/blip.wav',
  win: '/game-assets/win.wav',
};

let unlocked = false;
let ctx: AudioContext | null = null;
const cache = new Map<SoundName, AudioBuffer>();
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

async function loadBuffer(name: SoundName): Promise<AudioBuffer | null> {
  if (cache.has(name)) return cache.get(name)!;
  const audio = getCtx();
  if (!audio) return null;
  try {
    const res = await fetch(FILES[name]);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const decoded = await audio.decodeAudioData(buf.slice(0));
    cache.set(name, decoded);
    return decoded;
  } catch {
    return null;
  }
}

/** Synthetic fallback tones when asset files are missing. */
function synth(name: SoundName): void {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);

  const now = audio.currentTime;
  if (name === 'pop') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (name === 'blip') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.09);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554, now + 0.1);
    osc.frequency.setValueAtTime(659, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.46);
  }
}

export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  const audio = getCtx();
  if (audio && audio.state === 'suspended') {
    void audio.resume();
  }
  // Warm cache (best-effort)
  void loadBuffer('pop');
  void loadBuffer('blip');
  void loadBuffer('win');
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export async function play(name: SoundName): Promise<void> {
  if (muted) return;
  unlockAudio();
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') {
    try {
      await audio.resume();
    } catch {
      return;
    }
  }
  const buffer = await loadBuffer(name);
  if (!buffer) {
    synth(name);
    return;
  }
  const src = audio.createBufferSource();
  const gain = audio.createGain();
  src.buffer = buffer;
  gain.gain.value = 0.45;
  src.connect(gain);
  gain.connect(audio.destination);
  src.start();
}
