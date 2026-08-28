import type { AmbientName } from './catalog';
import { createProceduralNoiseVoice, fillColoredNoise, type NoiseColor, type ProceduralNoiseVoice } from './noise';
import {
  clamp,
  configureEnvelope,
  configureFilter,
  createStereoPanner,
  DisposableBag,
  randomBetween,
  randomExponential,
  randomInt,
  safeLinearRamp,
  safeSetParam,
  setPan,
  smoothRamp,
} from './utils';

interface NoiseLayerOptions {
  color: NoiseColor;
  level: number;
  pan?: number;
  panMovement?: boolean;
  filters?: Array<{ type: BiquadFilterType; frequency: number; Q?: number; gain?: number }>;
  segmentSeconds?: number;
}

interface NoiseLayer {
  voice: ProceduralNoiseVoice;
  gain: GainNode;
  panner: AudioNode;
  filters: BiquadFilterNode[];
  baseLevel: number;
  dispose: () => void;
}

interface BurstOptions {
  color: NoiseColor;
  duration: number;
  level: number;
  frequency?: number;
  Q?: number;
  filterType?: BiquadFilterType;
  pan?: number;
  delay?: number;
  attack?: number;
  release?: number;
}

interface ToneOptions {
  startFrequency: number;
  endFrequency?: number;
  duration: number;
  level: number;
  type?: OscillatorType;
  filterFrequency?: number;
  filterType?: BiquadFilterType;
  Q?: number;
  pan?: number;
  delay?: number;
  attack?: number;
  release?: number;
  detune?: number;
  detuneEnd?: number;
}

interface ChordOptions {
  duration: number;
  level: number;
  type?: OscillatorType;
  attack?: number;
  release?: number;
  filterFrequency?: number;
  spread?: number;
}

/** Major-pentatonic semitone offsets, used for the gentle melodic voices. */
const PENTATONIC_OFFSETS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

function pentatonicNote(base: number, index: number): number {
  const offset = PENTATONIC_OFFSETS[((index % PENTATONIC_OFFSETS.length) + PENTATONIC_OFFSETS.length) % PENTATONIC_OFFSETS.length]!;
  const octave = Math.floor(index / PENTATONIC_OFFSETS.length);
  return base * Math.pow(2, (offset + octave * 12) / 12);
}

/**
 * One complete soundscape owns all of its nodes and timers. The controller
 * crossfades this instance as a single stereo stem, while the instance keeps
 * events independent so no short phrase or shared period can repeat.
 *
 * The catalogue is deliberately calm: every soundscape leans on slow filter
 * and gain drift, long attack/release envelopes, and sparse musical events
 * rather than continuous full-band noise.
 */
export class ProceduralSoundscape {
  readonly output: GainNode;

  private readonly bag = new DisposableBag();
  private readonly layers = new Set<NoiseLayer>();
  private readonly ephemeral = new Set<() => void>();
  private alive = true;
  private intensity = 0.72;
  constructor(private readonly context: AudioContext, readonly name: Exclude<AmbientName, 'none'>) {
    this.output = this.bag.addNode(context.createGain());
    safeSetParam(this.output.gain, 0.0001);
    this.bag.addCleanup(() => {
      for (const layer of [...this.layers]) this.disposeLayer(layer);
      for (const cleanup of [...this.ephemeral]) {
        try { cleanup(); } catch { /* */
        }
      }
      this.ephemeral.clear();
    });
  }

  start(): void {
    if (!this.alive) return;
    this.addIntensityDrift();
    switch (this.name) {
      case 'meadow-morning': this.setupMeadowMorning(); break;
      case 'mountain-stream': this.setupMountainStream(); break;
      case 'zen-garden': this.setupZenGarden(); break;
      case 'ocean-shore': this.setupOceanShore(); break;
      case 'pine-forest': this.setupPineForest(); break;
      case 'summer-night': this.setupSummerNight(); break;
      case 'floating-pads': this.setupFloatingPads(); break;
      case 'kalimba-lullaby': this.setupKalimbaLullaby(); break;
      case 'singing-bowls': this.setupSingingBowls(); break;
      case 'music-box-drift': this.setupMusicBoxDrift(); break;
    }
  }

  fadeTo(level: number, seconds: number): void {
    if (!this.alive) return;
    const now = this.context.currentTime;
    smoothRamp(this.output.gain, clamp(level, 0.0001, 1), now, Math.max(0, seconds));
  }

  stop(fadeSeconds = 1.05): void {
    if (!this.alive) return;
    const duration = Math.max(0, fadeSeconds);
    this.fadeTo(0.0001, duration);
    if (duration <= 0) this.dispose();
    else this.bag.setTimer(() => this.dispose(), Math.ceil((duration + 0.12) * 1000));
  }

  dispose(): void {
    if (!this.alive) return;
    this.alive = false;
    this.bag.dispose();
  }

  private setTimer(callback: () => void, delayMs: number): void {
    this.bag.setTimer(() => {
      if (this.alive) callback();
    }, delayMs);
  }

  private addIntensityDrift(): void {
    const drift = () => {
      if (!this.alive) return;
      this.intensity = clamp(this.intensity + randomBetween(-0.14, 0.14), 0.4, 0.95);
      this.setTimer(drift, randomBetween(9000, 20000));
    };
    this.setTimer(drift, randomBetween(5000, 11000));
  }

  private buildNoiseLayer(options: NoiseLayerOptions): NoiseLayer {
    const voice = createProceduralNoiseVoice(this.context, {
      color: options.color,
      segmentSeconds: options.segmentSeconds ?? 4.6,
    });
    const filters: BiquadFilterNode[] = [];
    let previous: AudioNode = voice.output;
    for (const filterSpec of options.filters ?? []) {
      const filter = this.bag.addNode(this.context.createBiquadFilter());
      configureFilter(filter, filterSpec.type, filterSpec.frequency, filterSpec.Q ?? 0.7, filterSpec.gain ?? 0);
      previous.connect(filter);
      previous = filter;
      filters.push(filter);
    }
    const gain = this.bag.addNode(this.context.createGain());
    safeSetParam(gain.gain, Math.max(0.0001, options.level));
    previous.connect(gain);
    const panner = this.bag.addNode(createStereoPanner(this.context, options.pan ?? randomBetween(-0.72, 0.72)));
    gain.connect(panner);
    panner.connect(this.output);

    const layer: NoiseLayer = {
      voice,
      gain,
      panner,
      filters,
      baseLevel: options.level,
      dispose: () => {
        try { voice.dispose(); } catch { /* */
        }
        for (const node of [voice.output, ...filters, gain, panner]) {
          try { node.disconnect(); } catch { /* */
          }
        }
      },
    };
    this.layers.add(layer);
    if (options.panMovement) this.addPanDrift(layer);
    return layer;
  }

  private disposeLayer(layer: NoiseLayer): void {
    if (!this.layers.delete(layer)) return;
    layer.dispose();
  }

  private addPanDrift(layer: NoiseLayer, minimum = -0.82, maximum = 0.82): void {
    const drift = () => {
      if (!this.alive || !this.layers.has(layer)) return;
      const now = this.context.currentTime;
      setPan(layer.panner, randomBetween(minimum, maximum), now + randomBetween(1.5, 4.5));
      this.setTimer(drift, randomBetween(6000, 17000));
    };
    this.setTimer(drift, randomBetween(3000, 10000));
  }

  private addGainDrift(layer: NoiseLayer, minimum: number, maximum: number, periodMin = 8000, periodMax = 20000): void {
    const drift = () => {
      if (!this.alive || !this.layers.has(layer)) return;
      const target = randomBetween(minimum, maximum) * (0.8 + this.intensity * 0.3);
      const now = this.context.currentTime;
      safeLinearRamp(layer.gain.gain, Math.max(0.0001, target), now + randomBetween(2, 4.5));
      this.setTimer(drift, randomBetween(periodMin, periodMax));
    };
    this.setTimer(drift, randomBetween(periodMin, periodMax));
  }

  private addFilterDrift(layer: NoiseLayer, minimum: number, maximum: number, periodMin = 9000, periodMax = 22000): void {
    const filter = layer.filters[0];
    if (!filter) return;
    const drift = () => {
      if (!this.alive || !this.layers.has(layer)) return;
      const now = this.context.currentTime;
      safeLinearRamp(filter.frequency, randomBetween(minimum, maximum), now + randomBetween(2, 5));
      this.setTimer(drift, randomBetween(periodMin, periodMax));
    };
    this.setTimer(drift, randomBetween(periodMin, periodMax));
  }

  // ---------------------------------------------------------------- nature --

  private setupMeadowMorning(): void {
    const breeze = this.buildNoiseLayer({
      color: 'pink',
      level: 0.085,
      pan: randomBetween(-0.2, 0.2),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 620, Q: 0.5 }],
      segmentSeconds: 6.4,
    });
    const airy = this.buildNoiseLayer({
      color: 'white',
      level: 0.018,
      pan: randomBetween(-0.55, 0.55),
      panMovement: true,
      filters: [{ type: 'bandpass', frequency: 2600, Q: 0.4 }],
      segmentSeconds: 5.2,
    });
    this.addGainDrift(breeze, 0.05, 0.12, 9000, 21000);
    this.addGainDrift(airy, 0.008, 0.028, 7000, 18000);

    // Warm open fifths that swell slowly underneath the field.
    const padChoices: number[][] = [
      [146.83, 220.0, 293.66], // D3, A3, D4
      [196.0, 246.94, 392.0], // G3, B3, G4
      [220.0, 277.18, 329.63], // A3, C#4, E4
    ];
    const padLoop = () => {
      if (!this.alive) return;
      const chord = padChoices[randomInt(0, padChoices.length - 1)]!;
      this.addChord(chord, {
        duration: randomBetween(18, 26),
        level: 0.011,
        attack: 5,
        release: 9,
        filterFrequency: 1250,
      });
      this.setTimer(padLoop, randomBetween(16000, 24000));
    };
    this.setTimer(padLoop, 1200);

    this.scheduleBirdSong(randomBetween(12000, 26000));
  }

  private scheduleBirdSong(delayMs: number): void {
    this.setTimer(() => {
      if (!this.alive) return;
      if (Math.random() < 0.75) this.birdSong();
      // Phrases arrive tens of seconds apart, so the field stays open and calm.
      this.scheduleBirdSong(randomBetween(24000, 60000));
    }, delayMs);
  }

  private birdSong(): void {
    const root = randomBetween(1900, 3400);
    const ratios = [1, 1.12, 1.19, 1.33, 0.89];
    const noteCount = randomInt(2, 4);
    const pan = randomBetween(-0.8, 0.8);
    let offset = randomBetween(0, 0.2);
    for (let index = 0; index < noteCount; index += 1) {
      const duration = randomBetween(0.22, 0.6);
      const frequency = root * ratios[randomInt(0, ratios.length - 1)]!;
      this.addTone({
        startFrequency: frequency,
        endFrequency: frequency * randomBetween(0.94, 1.12),
        duration,
        level: randomBetween(0.008, 0.018) * (0.7 + this.intensity * 0.4),
        type: 'sine',
        filterType: 'bandpass',
        filterFrequency: frequency,
        Q: 3,
        pan: clamp(pan + randomBetween(-0.12, 0.12), -1, 1),
        delay: offset,
        attack: randomBetween(0.02, 0.08),
        release: duration * 0.7,
      });
      offset += duration * randomBetween(0.8, 1.3);
    }
  }

  private setupMountainStream(): void {
    const body = this.buildNoiseLayer({
      color: 'brown',
      level: 0.075,
      pan: randomBetween(-0.15, 0.15),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 420, Q: 0.5 }],
      segmentSeconds: 6.2,
    });
    const flow = this.buildNoiseLayer({
      color: 'pink',
      level: 0.085,
      pan: randomBetween(-0.4, 0.4),
      panMovement: true,
      filters: [{ type: 'bandpass', frequency: 1150, Q: 0.6 }],
      segmentSeconds: 4.8,
    });
    const trickle = this.buildNoiseLayer({
      color: 'white',
      level: 0.03,
      pan: randomBetween(-0.7, 0.7),
      panMovement: true,
      filters: [{ type: 'bandpass', frequency: 3100, Q: 0.5 }],
      segmentSeconds: 4.2,
    });
    this.addGainDrift(body, 0.05, 0.1, 10000, 24000);
    this.addGainDrift(flow, 0.055, 0.12, 5500, 14000);
    this.addGainDrift(trickle, 0.012, 0.045, 4500, 12000);
    this.addFilterDrift(flow, 800, 1700, 8000, 20000);
    this.addFilterDrift(trickle, 2200, 4400, 7000, 18000);

    // Occasional clear drips over the continuous bed.
    const drip = () => {
      if (!this.alive) return;
      if (Math.random() < 0.7 * this.intensity) {
        const frequency = randomBetween(750, 2300);
        this.addTone({
          startFrequency: frequency,
          endFrequency: frequency * 0.92,
          duration: randomBetween(0.18, 0.5),
          level: randomBetween(0.005, 0.014),
          type: 'sine',
          filterType: 'bandpass',
          filterFrequency: frequency,
          Q: 4,
          pan: randomBetween(-0.9, 0.9),
          attack: 0.008,
          release: 0.32,
        });
      }
      this.setTimer(drip, randomExponential(2600, 600, 9000));
    };
    this.setTimer(drip, randomBetween(1500, 6000));
  }

  private setupZenGarden(): void {
    const breeze = this.buildNoiseLayer({
      color: 'brown',
      level: 0.06,
      pan: 0,
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 380, Q: 0.5 }],
      segmentSeconds: 7,
    });
    this.addGainDrift(breeze, 0.03, 0.09, 12000, 28000);

    // Pentatonic chimes with very long, patient decay. Strikes are sparse and
    // sometimes arrive as a slow two or three note arpeggio.
    const base = 261.63; // C4
    const strike = () => {
      if (!this.alive) return;
      const noteCount = Math.random() < 0.35 ? randomInt(2, 3) : 1;
      let offset = 0;
      let scaleIndex = randomInt(0, 7);
      for (let index = 0; index < noteCount; index += 1) {
        scaleIndex += randomInt(1, 3);
        const frequency = pentatonicNote(base, scaleIndex);
        const duration = randomBetween(7, 13);
        const pan = randomBetween(-0.6, 0.6);
        const level = randomBetween(0.012, 0.022) * (0.75 + this.intensity * 0.35);
        this.addTone({
          startFrequency: frequency,
          duration,
          level,
          type: 'triangle',
          filterType: 'lowpass',
          filterFrequency: frequency * 3.2,
          Q: 0.6,
          pan,
          delay: offset,
          attack: 0.01,
          release: duration * 0.85,
          detune: randomBetween(-4, 4),
        });
        // A quiet octave partial gives the struck tone a bell-like ring.
        this.addTone({
          startFrequency: frequency * 2,
          duration: duration * 0.7,
          level: level * 0.28,
          type: 'sine',
          filterType: 'lowpass',
          filterFrequency: frequency * 6,
          Q: 0.6,
          pan,
          delay: offset,
          attack: 0.008,
          release: duration * 0.6,
        });
        offset += randomBetween(0.9, 2.4);
      }
      this.setTimer(strike, randomBetween(7000, 17000));
    };
    this.setTimer(strike, randomBetween(3500, 9000));
  }

  private setupOceanShore(): void {
    // A calm sub drone under the waves so the shore feels anchored and soft.
    const droneLoop = () => {
      if (!this.alive) return;
      this.addTone({
        startFrequency: 55,
        duration: 34,
        level: 0.02,
        type: 'sine',
        filterType: 'lowpass',
        filterFrequency: 240,
        Q: 0.5,
        pan: 0,
        attack: 9,
        release: 14,
      });
      this.addTone({
        startFrequency: 82.41,
        duration: 34,
        level: 0.012,
        type: 'sine',
        filterType: 'lowpass',
        filterFrequency: 320,
        Q: 0.5,
        pan: randomBetween(-0.3, 0.3),
        attack: 10,
        release: 14,
      });
      this.setTimer(droneLoop, 28000);
    };
    this.setTimer(droneLoop, 400);

    for (let voice = 0; voice < 3; voice += 1) {
      this.scheduleWave(randomBetween(0, 7000) + voice * randomBetween(400, 1400));
    }
  }

  private scheduleWave(delayMs: number): void {
    this.setTimer(() => {
      if (!this.alive) return;
      this.wave();
      // Slow, unhurried swell periods keep the sea peaceful rather than busy.
      this.scheduleWave(randomBetween(6500, 14000));
    }, delayMs);
  }

  private wave(): void {
    const duration = randomBetween(9, 16);
    const start = this.context.currentTime + 0.025;
    const rise = randomBetween(2.2, 4.6);
    const crest = randomBetween(duration * 0.5, duration * 0.7);
    const peak = randomBetween(0.05, 0.1) * (0.7 + this.intensity * 0.4);
    const body = this.buildNoiseLayer({
      color: 'pink',
      level: 0.0001,
      pan: randomBetween(-0.85, 0.85),
      filters: [{ type: 'lowpass', frequency: randomBetween(240, 460), Q: 0.52 }],
      segmentSeconds: duration + 1.6,
    });
    const foam = this.buildNoiseLayer({
      color: 'white',
      level: 0.0001,
      pan: randomBetween(-0.9, 0.9),
      filters: [{ type: 'highpass', frequency: randomBetween(1300, 2400), Q: 0.5 }, { type: 'lowpass', frequency: randomBetween(4600, 7600), Q: 0.55 }],
      segmentSeconds: duration + 1.4,
    });
    safeSetParam(body.gain.gain, 0.0001, start);
    safeLinearRamp(body.gain.gain, peak, start + rise);
    safeLinearRamp(body.gain.gain, peak * randomBetween(0.85, 1.05), start + crest);
    safeLinearRamp(body.gain.gain, 0.0001, start + duration);
    safeSetParam(foam.gain.gain, 0.0001, start);
    safeLinearRamp(foam.gain.gain, peak * randomBetween(0.12, 0.3), start + crest - randomBetween(0.4, 0.9));
    safeLinearRamp(foam.gain.gain, 0.0001, start + Math.min(duration, crest + randomBetween(1, 2.2)));
    this.setTimer(() => {
      this.disposeLayer(body);
      this.disposeLayer(foam);
    }, Math.ceil((duration + 0.6) * 1000));
  }

  private setupPineForest(): void {
    const windLow = this.buildNoiseLayer({
      color: 'brown',
      level: 0.11,
      pan: randomBetween(-0.25, 0.25),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 480, Q: 0.55 }],
      segmentSeconds: 6.6,
    });
    const windHigh = this.buildNoiseLayer({
      color: 'pink',
      level: 0.04,
      pan: randomBetween(-0.6, 0.6),
      panMovement: true,
      filters: [{ type: 'bandpass', frequency: 780, Q: 0.45 }],
      segmentSeconds: 5.4,
    });
    this.addGainDrift(windLow, 0.07, 0.15, 10000, 24000);
    this.addGainDrift(windHigh, 0.018, 0.06, 8000, 20000);
    this.addFilterDrift(windLow, 320, 720, 11000, 26000);

    const padChoices: number[][] = [
      [98.0, 146.83, 196.0], // G2, D3, G3
      [87.31, 130.81, 174.61], // F2, C3, F3
      [110.0, 164.81, 220.0], // A2, E3, A3
    ];
    const padLoop = () => {
      if (!this.alive) return;
      const chord = padChoices[randomInt(0, padChoices.length - 1)]!;
      this.addChord(chord, {
        duration: randomBetween(22, 30),
        level: 0.009,
        attack: 6.5,
        release: 11,
        filterFrequency: 980,
      });
      this.setTimer(padLoop, randomBetween(20000, 28000));
    };
    this.setTimer(padLoop, 2000);

    const woodpecker = () => {
      if (!this.alive) return;
      if (Math.random() < 0.55 * this.intensity) this.woodpeckerRap();
      this.setTimer(woodpecker, randomBetween(28000, 75000));
    };
    this.setTimer(woodpecker, randomBetween(18000, 45000));
  }

  private woodpeckerRap(): void {
    const pan = randomBetween(-0.9, -0.35);
    const knocks = randomInt(4, 8);
    const frequency = randomBetween(950, 1500);
    let offset = randomBetween(0, 0.15);
    for (let index = 0; index < knocks; index += 1) {
      this.addNoiseBurst({
        color: 'white',
        duration: 0.055,
        level: 0.011 * (0.6 + this.intensity * 0.5),
        frequency: frequency + randomBetween(-160, 160),
        Q: 3.2,
        filterType: 'bandpass',
        pan: clamp(pan + randomBetween(-0.05, 0.05), -1, 1),
        delay: offset,
        attack: 0.002,
        release: 0.045,
      });
      offset += randomBetween(0.075, 0.13);
    }
  }

  private setupSummerNight(): void {
    const floor = this.buildNoiseLayer({
      color: 'brown',
      level: 0.016,
      pan: randomBetween(-0.2, 0.2),
      panMovement: true,
      filters: [{ type: 'highpass', frequency: 55, Q: 0.45 }, { type: 'lowpass', frequency: 750, Q: 0.45 }],
      segmentSeconds: 6.6,
    });
    this.addGainDrift(floor, 0.01, 0.024, 12000, 28000);

    // A very quiet moonlit chord breathing slowly under the meadow.
    const padLoop = () => {
      if (!this.alive) return;
      this.addChord([110.0, 164.81, 220.0, 261.63], {
        duration: randomBetween(26, 36),
        level: 0.006,
        attack: 8,
        release: 14,
        filterFrequency: 900,
      });
      this.setTimer(padLoop, randomBetween(24000, 34000));
    };
    this.setTimer(padLoop, 2500);

    for (let index = 0; index < randomInt(4, 6); index += 1) this.createCricket(randomBetween(0, 8000));

    const owl = () => {
      if (!this.alive) return;
      if (Math.random() < 0.6) this.owlHoot();
      this.setTimer(owl, randomBetween(45000, 110000));
    };
    this.setTimer(owl, randomBetween(30000, 70000));
  }

  private createCricket(initialDelay: number): void {
    const oscillator = this.bag.addNode(this.context.createOscillator());
    const filter = this.bag.addNode(this.context.createBiquadFilter());
    const voiceGain = this.bag.addNode(this.context.createGain());
    const pulseGain = this.bag.addNode(this.context.createGain());
    const panner = this.bag.addNode(createStereoPanner(this.context, randomBetween(-0.9, 0.9)));
    const carrier = randomBetween(3400, 6800);
    try { oscillator.type = 'sine'; } catch { /* */
    }
    safeSetParam(oscillator.frequency, carrier);
    configureFilter(filter, 'bandpass', carrier, randomBetween(4, 10));
    safeSetParam(voiceGain.gain, randomBetween(0.004, 0.01));
    safeSetParam(pulseGain.gain, 0.0001);
    oscillator.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(pulseGain);
    pulseGain.connect(panner);
    panner.connect(this.output);
    try { oscillator.start(); } catch { /* */
    }

    const drift = () => {
      if (!this.alive) return;
      const now = this.context.currentTime;
      safeLinearRamp(oscillator.frequency, carrier * randomBetween(0.96, 1.05), now + randomBetween(2, 5));
      setPan(panner, randomBetween(-0.92, 0.92), now + randomBetween(2, 5));
      this.setTimer(drift, randomBetween(9000, 22000));
    };
    this.setTimer(drift, randomBetween(6000, 14000));

    const cycle = (delay: number) => {
      this.setTimer(() => {
        if (!this.alive) return;
        const activeFor = randomBetween(6000, 16000);
        const activeEnd = Date.now() + activeFor;
        const pulse = () => {
          if (!this.alive) return;
          if (Date.now() >= activeEnd) {
            safeSetParam(pulseGain.gain, 0.0001);
            cycle(randomBetween(9000, 34000));
            return;
          }
          const now = this.context.currentTime;
          const pulseDuration = randomBetween(0.06, 0.16);
          const level = randomBetween(0.4, 0.9) * (0.65 + this.intensity * 0.35);
          safeSetParam(pulseGain.gain, 0.0001, now);
          safeLinearRamp(pulseGain.gain, level, now + pulseDuration * 0.3);
          safeLinearRamp(pulseGain.gain, 0.0001, now + pulseDuration * 1.8);
          this.setTimer(pulse, randomBetween(140, 420));
        };
        pulse();
      }, delay);
    };
    cycle(initialDelay);
  }

  private owlHoot(): void {
    const pan = randomBetween(-0.8, 0.2);
    const base = randomBetween(235, 300);
    for (const hoot of [0, 0.85]) {
      this.addTone({
        startFrequency: base,
        endFrequency: base * 0.9,
        duration: randomBetween(0.4, 0.55),
        level: 0.014,
        type: 'sine',
        filterType: 'lowpass',
        filterFrequency: base * 3,
        Q: 1,
        pan: clamp(pan + randomBetween(-0.08, 0.08), -1, 1),
        delay: hoot,
        attack: 0.09,
        release: 0.3,
      });
    }
  }

  // ------------------------------------------------------------- music -----

  private setupFloatingPads(): void {
    // Pure calm music with no noise bed: soft chords that drift slowly.
    const roots = [110.0, 87.31, 130.81, 98.0]; // Am, F, C, G
    const intervals = [
      [0, 7, 12, 15],
      [0, 9, 12, 16],
      [0, 7, 11, 14],
      [0, 7, 12, 14],
    ];
    const chordSeconds = 20;
    let chordIndex = randomInt(0, roots.length - 1);

    const loop = () => {
      if (!this.alive) return;
      const root = roots[chordIndex % roots.length]!;
      const chord = intervals[chordIndex % intervals.length]!.map((interval) => root * Math.pow(2, interval / 12));
      this.addChord(chord, {
        duration: chordSeconds + randomBetween(-2, 4),
        level: 0.013,
        type: Math.random() > 0.5 ? 'triangle' : 'sine',
        attack: 5.5,
        release: 9,
        filterFrequency: 1350,
      });
      // Occasionally a single high note floats above the chord.
      if (Math.random() < 0.4) {
        this.addTone({
          startFrequency: root * randomBetween(4, 6),
          duration: randomBetween(6, 11),
          level: 0.006,
          type: 'sine',
          filterType: 'lowpass',
          filterFrequency: 2600,
          Q: 0.5,
          pan: randomBetween(-0.7, 0.7),
          attack: 2.5,
          release: 5,
          detune: randomBetween(-6, 6),
        });
      }
      chordIndex = (chordIndex + 1) % roots.length;
      this.setTimer(loop, chordSeconds * 1000 - 4500);
    };
    this.setTimer(loop, 300);
  }

  private setupKalimbaLullaby(): void {
    const roots = [130.81, 110.0, 87.31, 98.0]; // C, Am, F, G
    const intervals = [
      [0, 7, 12, 16],
      [0, 7, 12, 15],
      [0, 9, 12, 16],
      [0, 7, 12, 14],
    ];
    const chordSeconds = 24;
    let chordIndex = randomInt(0, roots.length - 1);

    const padLoop = () => {
      if (!this.alive) return;
      const root = roots[chordIndex % roots.length]!;
      const chord = intervals[chordIndex % intervals.length]!.map((interval) => root * Math.pow(2, interval / 12));
      this.addChord(chord, {
        duration: chordSeconds + 2,
        level: 0.007,
        type: 'triangle',
        attack: 5,
        release: 9,
        filterFrequency: 1100,
      });
      chordIndex = (chordIndex + 1) % roots.length;
      this.setTimer(padLoop, chordSeconds * 1000 - 5000);
    };
    this.setTimer(padLoop, 400);

    // Gentle pentatonic plucks in the C5 octave with rests between phrases.
    const base = 523.25; // C5
    let scaleIndex = randomInt(0, 6);
    const noteLoop = () => {
      if (!this.alive) return;
      if (Math.random() < 0.72) {
        scaleIndex = clamp(scaleIndex + randomInt(-3, 3), 0, 9);
        this.pluck(pentatonicNote(base, scaleIndex), randomBetween(0.014, 0.024), randomBetween(1.6, 2.8), randomBetween(-0.6, 0.6));
      }
      this.setTimer(noteLoop, randomBetween(900, 2600));
    };
    this.setTimer(noteLoop, 1500);
  }

  private setupSingingBowls(): void {
    // A faint airy shimmer sits behind the resonant bowl tones.
    const air = this.buildNoiseLayer({
      color: 'white',
      level: 0.008,
      pan: 0,
      filters: [{ type: 'bandpass', frequency: 6200, Q: 0.35 }],
      segmentSeconds: 6,
    });
    this.addGainDrift(air, 0.004, 0.012, 12000, 26000);

    // Low bowl fundamentals (around the 136.1 Hz "om" region) with a harmonic.
    const bowlFrequencies = [136.1, 174.61, 210.0, 146.83, 196.0];
    const strike = () => {
      if (!this.alive) return;
      const frequency = bowlFrequencies[randomInt(0, bowlFrequencies.length - 1)]!;
      const duration = randomBetween(26, 40);
      const pan = randomBetween(-0.45, 0.45);
      // Two slightly detuned sines create the slow beating of a rubbed bowl.
      for (const detune of [-4.5, 4.5]) {
        this.addTone({
          startFrequency: frequency,
          duration,
          level: 0.016,
          type: 'sine',
          filterType: 'lowpass',
          filterFrequency: frequency * 6,
          Q: 0.7,
          pan,
          attack: randomBetween(1.4, 2.6),
          release: duration * 0.62,
          detune,
        });
      }
      this.addTone({
        startFrequency: frequency * 2.76,
        duration: duration * 0.6,
        level: 0.005,
        type: 'sine',
        filterType: 'lowpass',
        filterFrequency: frequency * 8,
        Q: 0.8,
        pan,
        attack: 1.2,
        release: duration * 0.5,
        detune: randomBetween(-5, 5),
      });
      this.setTimer(strike, randomBetween(19000, 38000));
    };
    this.setTimer(strike, 2500);
  }

  private setupMusicBoxDrift(): void {
    const air = this.buildNoiseLayer({
      color: 'pink',
      level: 0.012,
      pan: 0,
      filters: [{ type: 'lowpass', frequency: 5200, Q: 0.35 }],
      segmentSeconds: 6.4,
    });
    this.addGainDrift(air, 0.006, 0.018, 11000, 25000);

    const roots = [110.0, 130.81, 87.31, 98.0];
    const intervals = [
      [0, 7, 12, 15],
      [0, 7, 11, 14],
      [0, 9, 12, 16],
      [0, 7, 12, 14],
    ];
    const chordSeconds = 26;
    let chordIndex = randomInt(0, roots.length - 1);

    const padLoop = () => {
      if (!this.alive) return;
      const root = roots[chordIndex % roots.length]!;
      const chord = intervals[chordIndex % intervals.length]!.map((interval) => root * Math.pow(2, interval / 12));
      this.addChord(chord, {
        duration: chordSeconds + 2,
        level: 0.006,
        type: 'sine',
        attack: 6,
        release: 10,
        filterFrequency: 1500,
      });
      chordIndex = (chordIndex + 1) % roots.length;
      this.setTimer(padLoop, chordSeconds * 1000 - 6000);
    };
    this.setTimer(padLoop, 500);

    // High bell phrases arrive as short, gentle arpeggios with long pauses.
    const base = 659.25; // E5
    const phrase = () => {
      if (!this.alive) return;
      const noteCount = randomInt(3, 7);
      let offset = randomBetween(0, 0.3);
      let scaleIndex = randomInt(2, 8);
      for (let index = 0; index < noteCount; index += 1) {
        if (Math.random() < 0.85) {
          scaleIndex = clamp(scaleIndex + randomInt(-2, 3), 0, 10);
          const frequency = pentatonicNote(base, scaleIndex);
          this.pluck(frequency, randomBetween(0.008, 0.016), randomBetween(2.2, 4), randomBetween(-0.7, 0.7), offset);
        }
        offset += randomBetween(0.35, 0.85);
      }
      this.setTimer(phrase, randomBetween(11000, 24000));
    };
    this.setTimer(phrase, randomBetween(4000, 12000));
  }

  /** A soft plucked/bell note with a quiet octave partial for music-box timbre. */
  private pluck(frequency: number, level: number, duration: number, pan: number, delay = 0): void {
    this.addTone({
      startFrequency: frequency,
      duration,
      level,
      type: 'triangle',
      filterType: 'lowpass',
      filterFrequency: Math.min(6800, frequency * 4),
      Q: 0.7,
      pan,
      delay,
      attack: 0.006,
      release: duration * 0.8,
      detune: randomBetween(-5, 5),
    });
    this.addTone({
      startFrequency: frequency * 2,
      duration: duration * 0.6,
      level: level * 0.3,
      type: 'sine',
      filterType: 'lowpass',
      filterFrequency: Math.min(9000, frequency * 7),
      Q: 0.7,
      pan,
      delay,
      attack: 0.004,
      release: duration * 0.6,
    });
  }

  /** A sustained, slowly swelling chord; one long tone per chord tone. */
  private addChord(frequencies: number[], options: ChordOptions): void {
    const duration = options.duration;
    for (const frequency of frequencies) {
      this.addTone({
        startFrequency: frequency,
        endFrequency: frequency * randomBetween(0.998, 1.002),
        duration,
        level: options.level,
        type: options.type ?? 'triangle',
        filterType: 'lowpass',
        filterFrequency: options.filterFrequency ?? 1300,
        Q: 0.5,
        pan: randomBetween(-(options.spread ?? 0.5), options.spread ?? 0.5),
        attack: options.attack ?? duration * 0.28,
        release: options.release ?? duration * 0.45,
        detune: randomBetween(-6, 6),
        detuneEnd: randomBetween(-6, 6),
      });
    }
  }

  // ------------------------------------------------------------- primitives -

  private addNoiseBurst(options: BurstOptions): void {
    if (!this.alive || typeof this.context.createBuffer !== 'function') return;
    const duration = Math.max(0.012, options.duration);
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    let buffer: AudioBuffer;
    try {
      buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      fillColoredNoise(buffer.getChannelData(0), options.color, Math.floor(Math.random() * 0xffffffff));
    } catch {
      return;
    }
    const source = this.bag.addNode(this.context.createBufferSource());
    const gain = this.bag.addNode(this.context.createGain());
    const filter = this.bag.addNode(this.context.createBiquadFilter());
    const panner = this.bag.addNode(createStereoPanner(this.context, options.pan ?? randomBetween(-0.9, 0.9)));
    source.buffer = buffer;
    source.loop = false;
    configureFilter(filter, options.filterType ?? 'bandpass', options.frequency ?? 1200, options.Q ?? 0.8);
    const start = this.context.currentTime + Math.max(0.012, options.delay ?? 0);
    configureEnvelope(gain, start, duration, options.level, options.attack ?? duration * 0.1, options.release ?? duration * 0.55);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.output);
    try {
      source.start(start);
      source.stop(start + duration + 0.03);
    } catch {
      this.releaseEphemeral([source, gain, filter, panner], 0);
      return;
    }
    this.releaseEphemeral([source, gain, filter, panner], Math.ceil((duration + (options.delay ?? 0) + 0.18) * 1000));
  }

  private addTone(options: ToneOptions): void {
    if (!this.alive) return;
    const oscillator = this.bag.addNode(this.context.createOscillator());
    const gain = this.bag.addNode(this.context.createGain());
    const panner = this.bag.addNode(createStereoPanner(this.context, options.pan ?? randomBetween(-0.85, 0.85)));
    let final: AudioNode = oscillator;
    let filter: BiquadFilterNode | null = null;
    if (options.filterFrequency) {
      filter = this.bag.addNode(this.context.createBiquadFilter());
      configureFilter(filter, options.filterType ?? 'lowpass', options.filterFrequency, options.Q ?? 0.7);
      oscillator.connect(filter);
      final = filter;
    }
    const delay = Math.max(0.012, options.delay ?? 0);
    const start = this.context.currentTime + delay;
    const endFrequency = options.endFrequency ?? options.startFrequency;
    try { oscillator.type = options.type ?? 'triangle'; } catch { /* */
    }
    safeSetParam(oscillator.frequency, options.startFrequency, start);
    if (endFrequency !== options.startFrequency) safeLinearRamp(oscillator.frequency, endFrequency, start + options.duration);
    if (options.detune !== undefined) {
      safeSetParam(oscillator.detune, options.detune, start);
      if (options.detuneEnd !== undefined) safeLinearRamp(oscillator.detune, options.detuneEnd, start + options.duration);
    }
    configureEnvelope(gain, start, options.duration, options.level, options.attack ?? options.duration * 0.12, options.release ?? options.duration * 0.52);
    final.connect(gain);
    gain.connect(panner);
    panner.connect(this.output);
    try {
      oscillator.start(start);
      oscillator.stop(start + options.duration + 0.04);
    } catch {
      this.releaseEphemeral([oscillator, gain, panner, ...(filter ? [filter] : [])], 0);
      return;
    }
    this.releaseEphemeral([oscillator, gain, panner, ...(filter ? [filter] : [])], Math.ceil((options.duration + delay + 0.2) * 1000));
  }

  private releaseEphemeral(nodes: AudioNode[], delayMs: number): void {
    let released = false;
    const cleanup = () => {
      if (released) return;
      released = true;
      this.ephemeral.delete(cleanup);
      for (const node of nodes) {
        this.bag.removeNode(node);
        try { node.disconnect(); } catch { /* */
        }
      }
    };
    this.ephemeral.add(cleanup);
    this.setTimer(cleanup, delayMs);
  }
}
