export type SoundName = 'move' | 'place' | 'win' | 'lose' | 'merge' | 'flip' | 'hint' | 'tick' | 'error' | 'claim' | 'pop' | 'blip';
export interface SoundSpec { frequencies: number[]; duration: number; attack: number; release: number; waveform: OscillatorType; filter?: { type: BiquadFilterType; frequency: number; Q?: number }; }
export const SOUND_BANK: Record<SoundName, SoundSpec> = {
  move: { frequencies: [220], duration: .05, attack: .008, release: .035, waveform: 'sine', filter: { type: 'lowpass', frequency: 900 } },
  place: { frequencies: [440], duration: .08, attack: .01, release: .06, waveform: 'sine', filter: { type: 'lowpass', frequency: 1400 } },
  win: { frequencies: [392, 494, 587], duration: .25, attack: .015, release: .18, waveform: 'sine' },
  lose: { frequencies: [155], duration: .2, attack: .01, release: .16, waveform: 'sine', filter: { type: 'lowpass', frequency: 500 } },
  merge: { frequencies: [330, 440], duration: .12, attack: .01, release: .09, waveform: 'triangle', filter: { type: 'lowpass', frequency: 1200 } },
  flip: { frequencies: [300], duration: .09, attack: .005, release: .075, waveform: 'triangle', filter: { type: 'bandpass', frequency: 850, Q: .7 } },
  hint: { frequencies: [660], duration: .15, attack: .008, release: .12, waveform: 'sine' },
  tick: { frequencies: [260], duration: .03, attack: .003, release: .02, waveform: 'sine', filter: { type: 'lowpass', frequency: 650 } },
  error: { frequencies: [190], duration: .12, attack: .008, release: .09, waveform: 'sine', filter: { type: 'lowpass', frequency: 600 } },
  claim: { frequencies: [520], duration: .1, attack: .01, release: .07, waveform: 'triangle' },
  pop: { frequencies: [330], duration: .12, attack: .008, release: .09, waveform: 'triangle' },
  blip: { frequencies: [660], duration: .08, attack: .006, release: .06, waveform: 'sine' },
};
