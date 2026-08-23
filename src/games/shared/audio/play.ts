import { loadPref, savePref } from '../storage';
import { SOUND_BANK, type SoundName } from './sound-bank';
export type { SoundName } from './sound-bank';
export const SOUND_ENABLED = 'sound-enabled';
export const SOUND_VOLUME = 'sound-volume';
const MUTED = 'game-muted';
let context: AudioContext | null = null;
let unlocked = false;
let queue = Promise.resolve();
function getContext() { if (typeof window === 'undefined') return null; const C = window.AudioContext || (window as any).webkitAudioContext; return context ??= C ? new C() : null; }
export function unlockAudio() { unlocked = true; const c=getContext(); if (c?.state === 'suspended') void c.resume(); }
export function isMuted() { return loadPref(MUTED, false); }
export function setMuted(value:boolean, persist=true) { if (persist) savePref(MUTED,value); }
export function toggleMuted() { const next=!isMuted(); setMuted(next); return next; }
export function isSoundEnabled() { return loadPref(SOUND_ENABLED, true); }
export function setSoundEnabled(value:boolean) { savePref(SOUND_ENABLED,value); }
export function getSoundVolume() { const n=loadPref(SOUND_VOLUME,60); return typeof n==='number' && Number.isFinite(n) ? Math.max(0,Math.min(100,n)) : 60; }
export function setSoundVolume(value:number) { savePref(SOUND_VOLUME,Math.max(0,Math.min(100,Math.round(value)))); }
export function play(name: SoundName, options: { volume?: number } = {}): Promise<number> {
  if (isMuted() || !isSoundEnabled() || !unlocked) return Promise.resolve(0);
  const spec=SOUND_BANK[name]; if (!spec) return Promise.resolve(0);
  const run=queue.then(async()=>{ const c=getContext(); if(!c) return 0; if(c.state==='suspended') await c.resume().catch(()=>{}); const now=c.currentTime; const master=(getSoundVolume()/100)*(options.volume ?? 1)*.12;
    const filterSpec=spec.filter;
    spec.frequencies.forEach((frequency,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.type=spec.waveform; o.frequency.setValueAtTime(frequency,now); const f=filterSpec&&c.createBiquadFilter(); if(f&&filterSpec){f.type=filterSpec.type;f.frequency.value=filterSpec.frequency;f.Q.value=filterSpec.Q??1;o.connect(f);f.connect(g);}else o.connect(g);g.connect(c.destination); const start=now+i*.035; g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(master,start+spec.attack);g.gain.exponentialRampToValueAtTime(.0001, start+spec.duration);o.start(start);o.stop(start+spec.duration+.01); });
    await new Promise<void>(resolve=>setTimeout(resolve, spec.duration*1000)); return spec.duration;
  }); queue=run.then(()=>undefined,()=>undefined); return run;
}
