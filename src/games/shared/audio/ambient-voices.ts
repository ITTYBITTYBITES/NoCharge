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

/**
 * One complete soundscape owns all of its nodes and timers. The controller
 * crossfades this instance as a single stereo stem, while the instance keeps
 * events independent so no short phrase or shared period can repeat.
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
        try { cleanup(); } catch { /* */ }
      }
      this.ephemeral.clear();
    });
  }

  start(): void {
    if (!this.alive) return;
    this.addIntensityDrift();
    switch (this.name) {
      case 'white-noise': this.setupWhiteNoise(); break;
      case 'pink-noise': this.setupPinkNoise(); break;
      case 'brown-noise': this.setupBrownNoise(); break;
      case 'rainfall': this.setupRain(); break;
      case 'forest': this.setupForest(); break;
      case 'fireplace': this.setupFireplace(); break;
      case 'ocean': this.setupOcean(); break;
      case 'night': this.setupNight(); break;
      case 'room-murmur': this.setupRoomMurmur(); break;
      case 'library': this.setupLibrary(); break;
      case 'lofi': this.setupLofi(); break;
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
      this.intensity = clamp(this.intensity + randomBetween(-0.16, 0.16), 0.35, 1);
      this.setTimer(drift, randomBetween(6500, 16000));
    };
    this.setTimer(drift, randomBetween(4000, 9000));
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
        try { voice.dispose(); } catch { /* */ }
        for (const node of [voice.output, ...filters, gain, panner]) {
          try { node.disconnect(); } catch { /* */ }
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
      this.setTimer(drift, randomBetween(4800, 15000));
    };
    this.setTimer(drift, randomBetween(2500, 9000));
  }

  private addGainDrift(layer: NoiseLayer, minimum: number, maximum: number, periodMin = 5000, periodMax = 15000): void {
    const drift = () => {
      if (!this.alive || !this.layers.has(layer)) return;
      const target = randomBetween(minimum, maximum) * (0.78 + this.intensity * 0.34);
      const now = this.context.currentTime;
      safeLinearRamp(layer.gain.gain, Math.max(0.0001, target), now + randomBetween(1.2, 3.2));
      this.setTimer(drift, randomBetween(periodMin, periodMax));
    };
    this.setTimer(drift, randomBetween(periodMin, periodMax));
  }

  private addFilterDrift(layer: NoiseLayer, minimum: number, maximum: number, periodMin = 6500, periodMax = 18000): void {
    const filter = layer.filters[0];
    if (!filter) return;
    const drift = () => {
      if (!this.alive || !this.layers.has(layer)) return;
      const now = this.context.currentTime;
      safeLinearRamp(filter.frequency, randomBetween(minimum, maximum), now + randomBetween(1.5, 4));
      this.setTimer(drift, randomBetween(periodMin, periodMax));
    };
    this.setTimer(drift, randomBetween(periodMin, periodMax));
  }

  private setupWhiteNoise(): void {
    // No tonal filter: the worklet/fallback itself is the full-band source.
    this.buildNoiseLayer({ color: 'white', level: 0.24, pan: 0, segmentSeconds: 5.4 });
  }

  private setupPinkNoise(): void {
    const layer = this.buildNoiseLayer({
      color: 'pink',
      level: 0.34,
      pan: 0,
      filters: [{ type: 'highpass', frequency: 24, Q: 0.55 }, { type: 'lowpass', frequency: 13500, Q: 0.35 }],
      segmentSeconds: 5.2,
    });
    this.addGainDrift(layer, 0.27, 0.39, 7000, 17000);
  }

  private setupBrownNoise(): void {
    const layer = this.buildNoiseLayer({
      color: 'brown',
      level: 0.26,
      pan: 0,
      filters: [{ type: 'highpass', frequency: 28, Q: 0.55 }, { type: 'lowpass', frequency: 650, Q: 0.5 }],
      segmentSeconds: 5.8,
    });
    this.addGainDrift(layer, 0.2, 0.3, 8000, 19000);
  }

  private setupRain(): void {
    const bed = this.buildNoiseLayer({
      color: 'pink',
      level: 0.26,
      pan: randomBetween(-0.12, 0.12),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 1550, Q: 0.55 }],
      segmentSeconds: 5.4,
    });
    const roof = this.buildNoiseLayer({
      color: 'white',
      level: 0.095,
      pan: randomBetween(-0.65, 0.65),
      panMovement: true,
      filters: [{ type: 'highpass', frequency: 1350, Q: 0.5 }, { type: 'lowpass', frequency: 7600, Q: 0.65 }],
      segmentSeconds: 3.9,
    });
    this.addGainDrift(bed, 0.2, 0.34, 6500, 14500);
    this.addGainDrift(roof, 0.055, 0.14, 4800, 12000);

    const drops = () => {
      if (!this.alive) return;
      if (Math.random() < 0.76 * this.intensity) this.rainDrop();
      this.setTimer(drops, randomExponential(210, 45, 1150));
    };
    this.setTimer(drops, randomBetween(90, 600));

    const cluster = () => {
      if (!this.alive) return;
      if (Math.random() < 0.62 * this.intensity) {
        const count = randomInt(3, 11);
        for (let index = 0; index < count; index += 1) {
          this.setTimer(() => {
            if (this.alive) this.rainDrop(true);
          }, randomBetween(0, 1100) + index * randomBetween(35, 180));
        }
      }
      this.setTimer(cluster, randomBetween(9000, 28000));
    };
    this.setTimer(cluster, randomBetween(8000, 19000));
  }

  private rainDrop(heavy = false): void {
    const duration = randomBetween(0.045, heavy ? 0.42 : 0.27);
    const frequency = randomBetween(1050, heavy ? 6200 : 4900);
    const level = (heavy ? randomBetween(0.025, 0.075) : randomBetween(0.008, 0.038)) * (0.68 + this.intensity * 0.45);
    this.addNoiseBurst({
      color: Math.random() > 0.45 ? 'white' : 'pink',
      duration,
      level,
      frequency,
      Q: randomBetween(0.65, heavy ? 4.2 : 2.8),
      filterType: 'bandpass',
      pan: randomBetween(-0.92, 0.92),
      attack: randomBetween(0.002, Math.min(0.04, duration * 0.4)),
      release: randomBetween(duration * 0.35, duration * 0.82),
    });
    if (heavy && Math.random() < 0.38) {
      this.addTone({
        startFrequency: frequency * randomBetween(0.78, 1.24),
        endFrequency: frequency * randomBetween(0.62, 1.08),
        duration: duration * randomBetween(0.6, 1.6),
        level: level * randomBetween(0.12, 0.3),
        type: Math.random() > 0.5 ? 'triangle' : 'sine',
        filterFrequency: Math.min(7800, frequency * 2.2),
        Q: randomBetween(1.2, 4),
        pan: randomBetween(-0.9, 0.9),
        attack: randomBetween(0.004, 0.025),
        release: duration * 0.65,
      });
    }
  }

  private setupForest(): void {
    const wind = this.buildNoiseLayer({
      color: 'brown',
      level: 0.16,
      pan: randomBetween(-0.25, 0.25),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 620, Q: 0.55 }],
      segmentSeconds: 6.2,
    });
    const highWind = this.buildNoiseLayer({
      color: 'pink',
      level: 0.06,
      pan: randomBetween(-0.6, 0.6),
      panMovement: true,
      filters: [{ type: 'bandpass', frequency: 950, Q: 0.45 }],
      segmentSeconds: 4.8,
    });
    this.addGainDrift(wind, 0.11, 0.22, 8500, 19000);
    this.addGainDrift(highWind, 0.025, 0.085, 6500, 17000);
    this.addFilterDrift(wind, 330, 980, 9000, 21000);

    const leaves = () => {
      if (!this.alive) return;
      if (Math.random() < 0.72 * this.intensity) this.leafRustle();
      this.setTimer(leaves, randomExponential(2600, 550, 9200));
    };
    this.setTimer(leaves, randomBetween(700, 4000));
    this.scheduleBird(randomBetween(9000, 21000));
  }

  private leafRustle(): void {
    const duration = randomBetween(0.18, 1.6);
    this.addNoiseBurst({
      color: Math.random() > 0.4 ? 'white' : 'pink',
      duration,
      level: randomBetween(0.006, 0.028) * this.intensity,
      frequency: randomBetween(1200, 4800),
      Q: randomBetween(0.35, 1.6),
      filterType: 'bandpass',
      pan: randomBetween(-0.9, 0.9),
      attack: randomBetween(0.03, duration * 0.35),
      release: randomBetween(duration * 0.25, duration * 0.65),
    });
  }

  private scheduleBird(delayMs: number): void {
    this.setTimer(() => {
      if (!this.alive) return;
      if (Math.random() < 0.78) this.birdPhrase();
      // Bird phrases are deliberately separated by tens of seconds, unlike a
      // UI beep or a regularly ticking event.
      this.scheduleBird(randomBetween(26000, 68000));
    }, delayMs);
  }

  private birdPhrase(): void {
    const root = randomBetween(1500, 3300);
    const ratios = [1, 1.08, 1.16, 1.27, 0.94];
    const noteCount = randomInt(2, 5);
    const pan = randomBetween(-0.84, 0.84);
    let offset = randomBetween(0, 0.16);
    for (let index = 0; index < noteCount; index += 1) {
      const duration = randomBetween(0.18, 0.72);
      const startFrequency = root * ratios[randomInt(0, ratios.length - 1)]!;
      const movement = randomBetween(0.78, 1.27);
      this.addTone({
        startFrequency,
        endFrequency: startFrequency * movement,
        duration,
        level: randomBetween(0.009, 0.023),
        type: Math.random() > 0.34 ? 'triangle' : 'sine',
        filterType: 'bandpass',
        filterFrequency: startFrequency,
        Q: randomBetween(2.2, 7),
        pan: clamp(pan + randomBetween(-0.16, 0.16), -1, 1),
        delay: offset,
        attack: randomBetween(0.012, 0.07),
        release: randomBetween(duration * 0.35, duration * 0.72),
        detune: randomBetween(-10, 10),
      });
      offset += duration * randomBetween(0.55, 0.9);
    }
    this.addNoiseBurst({
      color: 'white',
      duration: randomBetween(0.25, 0.75),
      level: randomBetween(0.002, 0.007),
      frequency: root * randomBetween(0.8, 1.5),
      Q: randomBetween(1.2, 3.5),
      filterType: 'bandpass',
      pan,
      delay: 0.02,
      attack: 0.02,
      release: 0.55,
    });
  }

  private setupFireplace(): void {
    const flame = this.buildNoiseLayer({
      color: 'brown',
      level: 0.18,
      pan: randomBetween(-0.22, 0.22),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 310, Q: 0.5 }],
      segmentSeconds: 6.4,
    });
    const movement = this.buildNoiseLayer({
      color: 'pink',
      level: 0.065,
      pan: randomBetween(-0.6, 0.6),
      panMovement: true,
      filters: [{ type: 'bandpass', frequency: 520, Q: 0.55 }],
      segmentSeconds: 5.1,
    });
    this.addGainDrift(flame, 0.12, 0.24, 6500, 16000);
    this.addGainDrift(movement, 0.035, 0.09, 4200, 12000);
    this.addFilterDrift(movement, 260, 860, 7000, 18000);

    const crackle = () => {
      if (!this.alive) return;
      if (Math.random() < 0.62 * this.intensity) {
        const count = randomInt(2, 8);
        for (let index = 0; index < count; index += 1) {
          this.setTimer(() => {
            if (!this.alive) return;
            // Cubic weighting means small crackles are common and strong pops
            // are rare instead of every event having the same loudness.
            const level = 0.004 + Math.pow(Math.random(), 3.2) * 0.042;
            this.addNoiseBurst({
              color: Math.random() > 0.28 ? 'white' : 'pink',
              duration: randomBetween(0.012, 0.19),
              level: level * (0.62 + this.intensity * 0.55),
              frequency: randomBetween(900, 6200),
              Q: randomBetween(0.45, 3.4),
              filterType: 'bandpass',
              pan: randomBetween(-0.88, 0.88),
              attack: randomBetween(0.001, 0.018),
              release: randomBetween(0.02, 0.14),
            });
          }, randomBetween(0, 750) + index * randomBetween(25, 180));
        }
      }
      this.setTimer(crackle, randomExponential(780, 170, 4300));
    };
    this.setTimer(crackle, randomBetween(250, 1800));

    const pop = () => {
      if (!this.alive) return;
      if (Math.random() < 0.68 * this.intensity) {
        const level = 0.012 + Math.pow(Math.random(), 4.1) * 0.09;
        this.addNoiseBurst({
          color: 'brown',
          duration: randomBetween(0.12, 0.65),
          level,
          frequency: randomBetween(180, 1700),
          Q: randomBetween(0.7, 2.7),
          filterType: 'bandpass',
          pan: randomBetween(-0.88, 0.88),
          attack: randomBetween(0.003, 0.045),
          release: randomBetween(0.16, 0.55),
        });
      }
      this.setTimer(pop, randomBetween(7000, 26000));
    };
    this.setTimer(pop, randomBetween(6500, 18000));
  }

  private setupOcean(): void {
    // Four voices each own their timer and wave duration. None shares a master
    // oscillator, so overlaps do not reveal an eight-second envelope seam.
    for (let voice = 0; voice < 4; voice += 1) {
      this.scheduleWave(randomBetween(0, 6200) + voice * randomBetween(180, 980));
    }
    const seaDrift = () => {
      if (!this.alive) return;
      this.intensity = clamp(this.intensity + randomBetween(-0.11, 0.11), 0.38, 1);
      this.setTimer(seaDrift, randomBetween(8000, 22000));
    };
    this.setTimer(seaDrift, randomBetween(5000, 11000));
  }

  private scheduleWave(delayMs: number): void {
    this.setTimer(() => {
      if (!this.alive) return;
      this.wave();
      this.scheduleWave(randomBetween(3300, 9300));
    }, delayMs);
  }

  private wave(): void {
    const duration = randomBetween(6, 14);
    const start = this.context.currentTime + 0.025;
    const rise = randomBetween(1.4, 3.4);
    const crest = randomBetween(duration * 0.46, duration * 0.68);
    const peak = randomBetween(0.06, 0.14) * (0.64 + this.intensity * 0.54);
    const body = this.buildNoiseLayer({
      color: Math.random() > 0.42 ? 'pink' : 'brown',
      level: 0.0001,
      pan: randomBetween(-0.88, 0.88),
      filters: [{ type: 'lowpass', frequency: randomBetween(250, 560), Q: 0.52 }],
      segmentSeconds: duration + 1.6,
    });
    const foam = this.buildNoiseLayer({
      color: 'white',
      level: 0.0001,
      pan: randomBetween(-0.92, 0.92),
      filters: [{ type: 'highpass', frequency: randomBetween(1100, 2600), Q: 0.5 }, { type: 'lowpass', frequency: randomBetween(5200, 9200), Q: 0.55 }],
      segmentSeconds: duration + 1.4,
    });
    safeSetParam(body.gain.gain, 0.0001, start);
    safeLinearRamp(body.gain.gain, peak, start + rise);
    safeLinearRamp(body.gain.gain, peak * randomBetween(0.82, 1.06), start + crest);
    safeLinearRamp(body.gain.gain, 0.0001, start + duration);
    safeSetParam(foam.gain.gain, 0.0001, start);
    safeLinearRamp(foam.gain.gain, peak * randomBetween(0.18, 0.42), start + crest - randomBetween(0.25, 0.65));
    safeLinearRamp(foam.gain.gain, 0.0001, start + Math.min(duration, crest + randomBetween(0.65, 1.6)));
    this.setTimer(() => {
      this.disposeLayer(body);
      this.disposeLayer(foam);
    }, Math.ceil((duration + 0.45) * 1000));
  }

  private setupNight(): void {
    const floor = this.buildNoiseLayer({
      color: 'brown',
      level: 0.014,
      pan: randomBetween(-0.2, 0.2),
      panMovement: true,
      filters: [{ type: 'highpass', frequency: 55, Q: 0.45 }, { type: 'lowpass', frequency: 900, Q: 0.45 }],
      segmentSeconds: 6.2,
    });
    this.addGainDrift(floor, 0.009, 0.022, 10000, 24000);

    const insectCount = randomInt(5, 8);
    for (let index = 0; index < insectCount; index += 1) this.createInsect(randomBetween(0, 6500));
  }

  private createInsect(initialDelay: number): void {
    const oscillator = this.bag.addNode(this.context.createOscillator());
    const filter = this.bag.addNode(this.context.createBiquadFilter());
    const voiceGain = this.bag.addNode(this.context.createGain());
    const pulseGain = this.bag.addNode(this.context.createGain());
    const panner = this.bag.addNode(createStereoPanner(this.context, randomBetween(-0.93, 0.93)));
    const carrier = randomBetween(2800, 7600);
    const pulseShape = Math.random();
    try { oscillator.type = pulseShape > 0.66 ? 'square' : pulseShape > 0.3 ? 'triangle' : 'sawtooth'; } catch { /* */ }
    safeSetParam(oscillator.frequency, carrier);
    configureFilter(filter, 'bandpass', carrier, randomBetween(3, 13));
    safeSetParam(voiceGain.gain, randomBetween(0.006, 0.018));
    safeSetParam(pulseGain.gain, 0.0001);
    oscillator.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(pulseGain);
    pulseGain.connect(panner);
    panner.connect(this.output);
    try { oscillator.start(); } catch { /* */ }

    const driftCarrier = () => {
      if (!this.alive) return;
      const now = this.context.currentTime;
      safeLinearRamp(oscillator.frequency, carrier * randomBetween(0.94, 1.07), now + randomBetween(1.4, 4));
      setPan(panner, randomBetween(-0.94, 0.94), now + randomBetween(1.5, 4.5));
      this.setTimer(driftCarrier, randomBetween(6500, 19000));
    };
    this.setTimer(driftCarrier, randomBetween(4500, 12000));

    const cycle = (delay: number) => {
      this.setTimer(() => {
        if (!this.alive) return;
        const activeFor = randomBetween(4500, 18500);
        const activeEnd = Date.now() + activeFor;
        const pulse = () => {
          if (!this.alive) return;
          if (Date.now() >= activeEnd) {
            safeSetParam(pulseGain.gain, 0.0001);
            cycle(randomBetween(5500, 30000));
            return;
          }
          const now = this.context.currentTime;
          const pulseDuration = randomBetween(0.035, pulseShape > 0.5 ? 0.21 : 0.46);
          const level = randomBetween(0.35, 1) * (0.7 + this.intensity * 0.38);
          safeSetParam(pulseGain.gain, 0.0001, now);
          if (pulseShape > 0.5) {
            safeLinearRamp(pulseGain.gain, level, now + pulseDuration * 0.12);
            safeLinearRamp(pulseGain.gain, 0.0001, now + pulseDuration);
          } else {
            safeLinearRamp(pulseGain.gain, level, now + pulseDuration * 0.45);
            safeLinearRamp(pulseGain.gain, 0.0001, now + pulseDuration * 1.7);
          }
          this.setTimer(pulse, randomBetween(95, pulseShape > 0.4 ? 520 : 880));
        };
        pulse();
      }, delay);
    };
    cycle(initialDelay);
  }

  private setupRoomMurmur(): void {
    const floor = this.buildNoiseLayer({
      color: 'pink',
      level: 0.055,
      pan: randomBetween(-0.18, 0.18),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 420, Q: 0.5 }],
      segmentSeconds: 6.1,
    });
    this.addGainDrift(floor, 0.035, 0.075, 9000, 22000);

    // These are broad, low-level formant-filtered noise voices rather than
    // speech or syllables. They never use periodic voice modulation.
    const formants = [
      { frequency: 190, Q: 0.55, level: 0.018 },
      { frequency: 430, Q: 0.7, level: 0.014 },
      { frequency: 880, Q: 0.6, level: 0.009 },
      { frequency: 1460, Q: 0.45, level: 0.006 },
    ];
    for (const formant of formants) {
      const layer = this.buildNoiseLayer({
        color: Math.random() > 0.45 ? 'pink' : 'white',
        level: formant.level,
        pan: randomBetween(-0.85, 0.85),
        panMovement: true,
        filters: [{ type: 'bandpass', frequency: formant.frequency, Q: formant.Q }],
        segmentSeconds: randomBetween(4.8, 7.2),
      });
      this.addGainDrift(layer, formant.level * 0.45, formant.level * 1.25, 6500, 19000);
    }

    const object = () => {
      if (!this.alive) return;
      if (Math.random() < 0.42 * this.intensity) {
        this.addNoiseBurst({
          color: Math.random() > 0.5 ? 'white' : 'pink',
          duration: randomBetween(0.12, 0.65),
          level: randomBetween(0.002, 0.009),
          frequency: randomBetween(420, 1900),
          Q: randomBetween(1, 4),
          filterType: 'bandpass',
          pan: randomBetween(-0.85, 0.85),
          attack: randomBetween(0.005, 0.08),
          release: randomBetween(0.12, 0.48),
        });
      }
      this.setTimer(object, randomBetween(14000, 38000));
    };
    this.setTimer(object, randomBetween(9000, 24000));
  }

  private setupLibrary(): void {
    const room = this.buildNoiseLayer({
      color: 'brown',
      level: 0.022,
      pan: randomBetween(-0.16, 0.16),
      panMovement: true,
      filters: [{ type: 'highpass', frequency: 38, Q: 0.5 }, { type: 'lowpass', frequency: 460, Q: 0.45 }],
      segmentSeconds: 6.8,
    });
    const ventilation = this.buildNoiseLayer({
      color: 'pink',
      level: 0.012,
      pan: randomBetween(-0.5, 0.5),
      panMovement: true,
      filters: [{ type: 'lowpass', frequency: 780, Q: 0.4 }],
      segmentSeconds: 5.8,
    });
    this.addGainDrift(room, 0.014, 0.029, 12000, 28000);
    this.addGainDrift(ventilation, 0.007, 0.017, 14000, 30000);

    const page = () => {
      if (!this.alive) return;
      if (Math.random() < 0.58) this.pageTurn();
      this.setTimer(page, randomBetween(20000, 55000));
    };
    this.setTimer(page, randomBetween(13000, 32000));

    const creak = () => {
      if (!this.alive) return;
      if (Math.random() < 0.45) {
        this.addTone({
          startFrequency: randomBetween(130, 260),
          endFrequency: randomBetween(180, 440),
          duration: randomBetween(0.35, 1.7),
          level: randomBetween(0.0015, 0.006),
          type: 'triangle',
          filterType: 'lowpass',
          filterFrequency: randomBetween(480, 1100),
          Q: randomBetween(0.6, 2.2),
          pan: randomBetween(-0.8, 0.8),
          attack: randomBetween(0.08, 0.35),
          release: randomBetween(0.45, 1.1),
        });
      }
      this.setTimer(creak, randomBetween(30000, 85000));
    };
    this.setTimer(creak, randomBetween(24000, 60000));
  }

  private pageTurn(): void {
    const pan = randomBetween(-0.75, 0.75);
    const strokeCount = randomInt(3, 6);
    let offset = 0;
    for (let index = 0; index < strokeCount; index += 1) {
      const duration = randomBetween(0.24, 1.05);
      this.addNoiseBurst({
        color: 'pink',
        duration,
        level: randomBetween(0.0012, 0.0052),
        frequency: randomBetween(620, 3000),
        Q: randomBetween(0.35, 1.25),
        filterType: 'bandpass',
        pan: clamp(pan + randomBetween(-0.14, 0.14), -1, 1),
        delay: offset,
        attack: randomBetween(0.08, duration * 0.36),
        release: randomBetween(duration * 0.3, duration * 0.72),
      });
      offset += duration * randomBetween(0.45, 0.84);
    }
  }

  private setupLofi(): void {
    const tape = this.buildNoiseLayer({
      color: 'pink',
      level: 0.014,
      pan: 0,
      filters: [{ type: 'lowpass', frequency: 6800, Q: 0.3 }],
      segmentSeconds: 6.6,
    });
    this.addGainDrift(tape, 0.009, 0.019, 9000, 21000);
    this.addFilterDrift(tape, 4200, 8200, 10000, 22000);

    const roots = [130.81, 110, 87.31, 98]; // C minor-seven colour, Am, F, G
    const chordIntervals = [
      [0, 3, 7, 10],
      [0, 3, 7, 10],
      [0, 4, 7, 11],
      [0, 4, 7, 10],
    ];
    const beatSeconds = 60 / 72;
    const barSeconds = beatSeconds * 4;
    let barIndex = 0;
    let nextBarTime = this.context.currentTime + 0.12;

    const scheduleBar = () => {
      if (!this.alive) return;
      const start = Math.max(nextBarTime, this.context.currentTime + 0.035);
      const chordIndex = barIndex % roots.length;
      const section = Math.floor(barIndex / 8);
      const root = roots[chordIndex]!;
      const intervals = chordIntervals[chordIndex]!;
      const humanStart = randomBetween(-0.012, 0.012);

      // Pads sustain across the bar with a long release; progression changes
      // happen in four-bar phrases and instrumentation changes every eight.
      for (const interval of intervals) {
        const frequency = root * Math.pow(2, interval / 12);
        this.addTone({
          startFrequency: frequency,
          endFrequency: frequency * randomBetween(0.997, 1.003),
          duration: barSeconds * 1.28,
          level: section % 2 === 0 ? 0.012 : 0.009,
          type: 'triangle',
          filterType: 'lowpass',
          filterFrequency: 1450 + section % 3 * 220,
          Q: 0.45,
          pan: randomBetween(-0.55, 0.55),
          delay: Math.max(0, start - this.context.currentTime + humanStart),
          attack: 0.18,
          release: 0.95,
          detune: randomBetween(-7, 7),
          detuneEnd: randomBetween(-7, 7),
        });
      }

      // Bass is always the active chord root or its octave, never a random
      // pitch set. This keeps the generated music coherent.
      this.addTone({
        startFrequency: root / 2,
        endFrequency: root / 2 * randomBetween(0.998, 1.002),
        duration: beatSeconds * 1.55,
        level: 0.026,
        type: 'triangle',
        filterType: 'lowpass',
        filterFrequency: 520,
        Q: 0.55,
        pan: randomBetween(-0.18, 0.18),
        delay: Math.max(0, start - this.context.currentTime + humanStart),
        attack: 0.018,
        release: 0.72,
        detune: randomBetween(-4, 4),
        detuneEnd: randomBetween(-4, 4),
      });
      if (barIndex % 4 === 2 || barIndex % 4 === 3) {
        this.addTone({
          startFrequency: root,
          duration: beatSeconds * 0.9,
          level: 0.012,
          type: 'triangle',
          filterType: 'lowpass',
          filterFrequency: 640,
          Q: 0.5,
          pan: randomBetween(-0.22, 0.22),
          delay: Math.max(0, start - this.context.currentTime + beatSeconds * 2 + randomBetween(-0.01, 0.014)),
          attack: 0.015,
          release: 0.42,
        });
      }

      const velocity = randomBetween(0.72, 1.08);
      this.addKick(start, 0.052 * velocity);
      if (section % 2 === 0 || barIndex % 4 !== 0) this.addKick(start + beatSeconds * 2 + randomBetween(-0.012, 0.012), 0.038 * velocity);
      this.addSnare(start + beatSeconds + randomBetween(-0.014, 0.014), 0.018 * velocity);
      this.addSnare(start + beatSeconds * 3 + randomBetween(-0.014, 0.014), 0.02 * velocity);

      // Eighth hats use a small swing offset and randomized omissions. The
      // timing is grouped into bars rather than a stream of unrelated notes.
      for (let step = 0; step < 8; step += 1) {
        if (Math.random() < (section % 2 === 0 ? 0.82 : 0.68)) {
          const swing = step % 2 === 1 ? beatSeconds * 0.5 * 0.12 : 0;
          this.addHat(start + step * beatSeconds * 0.5 + swing + randomBetween(-0.012, 0.012), randomBetween(0.004, 0.009));
        }
      }

      barIndex += 1;
      nextBarTime = start + barSeconds;
      this.setTimer(scheduleBar, Math.max(55, (nextBarTime - this.context.currentTime - 0.075) * 1000));
    };

    this.setTimer(scheduleBar, 90);
  }

  private addKick(start: number, level: number): void {
    const oscillator = this.bag.addNode(this.context.createOscillator());
    const gain = this.bag.addNode(this.context.createGain());
    const panner = this.bag.addNode(createStereoPanner(this.context, randomBetween(-0.08, 0.08)));
    try { oscillator.type = 'sine'; } catch { /* */ }
    safeSetParam(oscillator.frequency, 124, start);
    safeLinearRamp(oscillator.frequency, 48, start + 0.12);
    safeSetParam(gain.gain, 0.0001, start);
    safeLinearRamp(gain.gain, level, start + 0.006);
    safeLinearRamp(gain.gain, 0.0001, start + 0.22);
    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(this.output);
    try {
      oscillator.start(start);
      oscillator.stop(start + 0.25);
    } catch { /* */ }
    this.releaseEphemeral([oscillator, gain, panner], 360);
  }

  private addSnare(start: number, level: number): void {
    this.addNoiseBurst({
      color: 'white',
      duration: 0.16,
      level,
      frequency: 2400,
      Q: 0.55,
      filterType: 'highpass',
      pan: randomBetween(-0.2, 0.2),
      delay: Math.max(0, start - this.context.currentTime),
      attack: 0.004,
      release: 0.11,
    });
    this.addTone({
      startFrequency: 185,
      endFrequency: 130,
      duration: 0.12,
      level: level * 0.55,
      type: 'triangle',
      filterFrequency: 500,
      filterType: 'lowpass',
      pan: randomBetween(-0.18, 0.18),
      delay: Math.max(0, start - this.context.currentTime),
      attack: 0.003,
      release: 0.08,
    });
  }

  private addHat(start: number, level: number): void {
    this.addNoiseBurst({
      color: 'white',
      duration: randomBetween(0.035, 0.085),
      level,
      frequency: randomBetween(4800, 9000),
      Q: randomBetween(0.4, 1.1),
      filterType: 'highpass',
      pan: randomBetween(-0.5, 0.5),
      delay: Math.max(0, start - this.context.currentTime),
      attack: 0.002,
      release: randomBetween(0.025, 0.065),
    });
  }

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
    try { oscillator.type = options.type ?? 'triangle'; } catch { /* */ }
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
        try { node.disconnect(); } catch { /* */ }
      }
    };
    this.ephemeral.add(cleanup);
    this.setTimer(cleanup, delayMs);
  }
}
