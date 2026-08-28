const PROCESSOR_NAME = 'nocharge-stereo-noise';

/*
 * This processor is deliberately self-contained. It has no imports, samples,
 * recordings, or repeating table: every sample is generated from two separate
 * seeded random streams inside the audio render thread.
 */
class StereoNoiseProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options?.processorOptions ?? {};
    this.color = processorOptions.color ?? 'white';
    this.left = this.makeState((processorOptions.seed ?? 0x13579bdf) >>> 0);
    this.right = this.makeState(((processorOptions.seed ?? 0x2468ace0) ^ 0x9e3779b9) >>> 0);
    this.modulation = 1;
    this.modulationTarget = 1;
    this.samplesUntilModulation = 1;

    this.port.onmessage = (event) => {
      if (event.data?.type === 'color') this.color = event.data.color;
      if (event.data?.type === 'seed') {
        this.left = this.makeState(event.data.seed >>> 0);
        this.right = this.makeState((event.data.seed ^ 0x9e3779b9) >>> 0);
      }
    };
  }

  makeState(seed) {
    return {
      seed: seed || 0x6d2b79f5,
      pink: [0, 0, 0, 0, 0, 0, 0],
      brown: 0,
      previousBrown: 0,
    };
  }

  random(state) {
    // xorshift32 is inexpensive enough for every rendered sample and avoids
    // sharing Math.random state between the left and right channels.
    let value = state.seed | 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    state.seed = value >>> 0;
    return state.seed / 4294967296;
  }

  pinkNoise(state, white) {
    // Paul Kellet's economy pinking filter. The coefficients are documented in
    // docs/SOUND_DESIGN.md and produce decreasing energy in higher bands.
    const p = state.pink;
    p[0] = 0.99886 * p[0] + white * 0.0555179;
    p[1] = 0.99332 * p[1] + white * 0.0750759;
    p[2] = 0.96900 * p[2] + white * 0.1538520;
    p[3] = 0.86650 * p[3] + white * 0.3104856;
    p[4] = 0.55000 * p[4] + white * 0.5329522;
    p[5] = -0.7616 * p[5] - white * 0.0168980;
    const pink = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + white * 0.5362;
    p[6] = white * 0.115926;
    return pink * 0.11;
  }

  brownNoise(state, white) {
    // A leaky integrator makes brown noise while the tiny decay term prevents
    // DC accumulation. The main-thread high-pass in brown-noise layers adds a
    // second guard before the signal reaches the output.
    state.brown = state.brown * 0.995 + white * 0.045;
    state.brown -= state.brown * 0.00008;
    const output = state.brown - state.previousBrown * 0.0003;
    state.previousBrown = state.brown;
    return output * 0.72;
  }

  colored(state) {
    const white = this.random(state) * 2 - 1;
    if (this.color === 'pink') return this.pinkNoise(state, white);
    if (this.color === 'brown') return this.brownNoise(state, white);
    return white * 0.32;
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    const left = output[0];
    const right = output[1] ?? output[0];

    for (let index = 0; index < left.length; index += 1) {
      if (this.samplesUntilModulation <= 0) {
        this.modulationTarget = 0.92 + this.random(this.left) * 0.16;
        this.samplesUntilModulation = Math.floor(sampleRate * (0.7 + this.random(this.left) * 1.6));
      }
      this.modulation += (this.modulationTarget - this.modulation) * 0.00004;
      this.samplesUntilModulation -= 1;
      left[index] = this.colored(this.left) * this.modulation;
      right[index] = this.colored(this.right) * this.modulation;
    }
    return true;
  }
}

registerProcessor(PROCESSOR_NAME, StereoNoiseProcessor);
