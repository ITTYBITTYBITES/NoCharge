# Sound design

NoCharge uses a small procedural Web Audio system. Every audible sample is made at runtime: there are no recordings, music loops, impulse-response files, speech calls, third-party audio samples, or downloaded media. The public product description is **procedural soundscapes**, not field recordings. `prefers-reduced-motion` changes visual motion only; sound has its own controls.

The preference hierarchy is system/browser mute → `nocharge:pref:game-muted` → `nocharge:pref:sound-enabled` for game effects → `nocharge:pref:sound-volume` for level → `nocharge:pref:ambient-sound` for selection. Defaults are effects enabled, volume 60, and ambient `none`. The toolbar mute button is the persistent master override for effects and ambient. Effects on/off never disables an ambient soundscape.

## Runtime architecture

- `audio/catalog.ts` owns the catalogue, labels, validation, the legacy `cafe`/`drone` migration, and the unchanged `nocharge:pref:ambient-sound` boundary.
- `audio/playback-state.ts` records the user-gesture unlock separately from preference state. No ambient or effect node is started before `unlockAudio()` has been called by a control event.
- `audio/engine.ts` creates one shared `AudioContext`, separate effects and ambient buses, a master gain, and a conservative final `DynamicsCompressorNode` safety limiter.
- `audio/ambient.ts` is the playback controller: it owns active selection, visibility suspension/resume state, master level, and approximately 1.05-second crossfades.
- `audio/ambient-voices.ts` creates soundscape-specific procedural layers, event distributions, stereo movement, envelopes, and composition voices.
- `audio/noise.ts` creates worklet-first stereo colored-noise voices. The same-origin first-party `public/audio/nocharge-ambient-worklet.js` generates independent left/right samples on the audio render thread. If `AudioWorklet` or its module is unavailable, new stereo segments are generated with fresh seeds and overlapped; no fallback segment loops.
- `DisposableBag` tracks timers, nodes, and cleanup callbacks. All source stop, selection changes, visibility changes, master mute, and teardown paths are idempotent and begin with a gain ramp.

The controller fades an old soundscape down before stopping it, starts a new soundscape at zero, and fades it up. Hidden-page handling stores whether audio was actually running; returning does not turn a saved-but-never-started preference into autoplay. The mixer and game shell call the same visibility API.

## Procedural catalogue

| Soundscape | Independent runtime layers |
|---|---|
| White noise | Continuous stereo white noise without tonal filtering; conservative level. |
| Pink noise | Continuous stereo pink noise, high-pass protected, with slow random level drift. |
| Brown noise | Leaky-integrated stereo brown noise with DC bleed, high-pass protection, and a low-pass ceiling. |
| Rain | Low pink bed, brighter roof/window texture, probabilistic varied droplets, occasional heavier clusters, slow intensity drift, and independent stereo placement. |
| Forest | Filtered wind, irregular leaf bursts, gradual density/brightness change, and rare multi-note moving bird phrases separated by tens of seconds. |
| Fireplace | Brown flame bed, mid flame movement, irregular crackle groups, sparse louder pops, cubic/power-law amplitude weighting, and changing stereo position. |
| Ocean | Four asynchronous wave voices. Each wave lasts about 6–14 seconds and has independent timing, low water body, crest foam, envelope, intensity, and pan. No wave uses a shared master period. |
| Night | Quiet environmental floor plus independent insect carriers with different waveforms, frequencies, pulse shapes, active periods, silent periods, density, and stereo distance. |
| Soft room murmur | Low room tone, broad formant-filtered noise voices with random movement, changing density, and sparse quiet material transients. It contains no speech-like words or speech synthesis. |
| Library | Extremely quiet ventilation, rare multi-stroke page-turn gestures, occasional material creaks, long foreground-event gaps, and randomized distant placement. |
| Lofi — Quiet Arcade | A procedural composition: four related chords, chord-derived bass, restrained synthesized kick/snare/hat, bar grouping, swing, humanized velocity/timing, eight-bar structure changes, tape-like noise, slow drift, and overlapping envelopes. It is not a random note stream or a recorded music loop. |

Rain, leaf movement, crackle, page, object, and droplet events use exponential or otherwise nonuniform waiting times. Their amplitudes, brightness, resonances, duration, envelope, and pan vary per event. Bird phrases contain related frequency movement and multiple notes; they are not notification beeps. Ocean waves are independently scheduled, not an eight-second envelope. Night insects have long randomized active/silent periods rather than a fixed two-tone tick.

The pink generator uses Paul Kellet's economy filter:

```text
b0 = 0.99886 b0 + white * 0.0555179
b1 = 0.99332 b1 + white * 0.0750759
b2 = 0.96900 b2 + white * 0.1538520
b3 = 0.86650 b3 + white * 0.3104856
b4 = 0.55000 b4 + white * 0.5329522
b5 = -0.7616 b5 - white * 0.0168980
pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6) + white * 0.5362
```

The result is scaled before output and should show decreasing energy across progressively higher bands. Brown noise uses a leaky integrator with a small DC bleed in both the worklet and fallback, then the soundscape adds a high-pass filter before the master bus.

## Controls and lifecycle

Sound on/off exposes `aria-pressed`; volume is a labeled 0–100 slider; Ambient offers None plus the eleven procedural soundscapes. Preferences are local-only. Master mute ramps the shared final gain and stops ambient voices. Ambient volume changes ramp the active bus without recreating voices. A hidden page fades and stops immediately; it resumes only when a soundscape was running before hiding and the prior gesture permission still exists. The page has no autoplay path.

Every game event continues through `shared/audio/play(name)`. Calls do not affect ambient selection. Each event has a visual counterpart: move/place is a focus or placement state, flip is the card animation, merge is the tile bloom, hint is a highlight, error is a soft error tint, claim is a claimed box, and win is the existing result panel. Live announcements never depend on audio.

| Game | Named events |
|---|---|
| Memory Match | `flip` on card reveal, `match` on a pair, `win` |
| Word Tile Rush | `place` on a committed word, `win` |
| Color Flip | `step` on a step, `place` on a matched step, `win` |
| Beacon Lattice | `place` on a beacon, `error` when blocked, `win` |
| Klondike | `flip` on a stock reveal, `place` on a move, `win` |
| FreeCell | `flip` on the first move after the deal, `place` on later moves, `win` |
| Nonogram | `place` on a mark, `hint` when a row or column clue is newly satisfied, `error` if a filled mark contradicts the solution, `win` |
| 2048 | `merge` on every merge (score increase), `win` on reaching 2048 |
| Tile Garden | `place` on a drop, `merge` when a 2×2 merge fires, `win` |
| Word Search | `place` on a found word, `hint` on a requested hint, `win` |
| Mini Sudoku | `place` on a fill, `error` on a conflicting fill or a Check that finds a wrong cell, `hint` on Reveal, `win` |
| Tic-Tac-Toe | `place`, `win` |
| Dots & Boxes | `place` on a drawn edge, `claim` when a box is completed, `win` |
| Four in a Row | `place` on a disc drop, `win` |
| Reversi | `place` on a disc, `flip` when opponent discs turn, `win` |
| Last Token | `place` on a take, `error` then `win` when the last token is taken (soft loss, then the other player’s win) |
| Pass the Picture | `place` on a completed stroke, `win` when the picture is finished |

The sound layer remains the only path to an oscillator or generated noise voice; game modules never create AudioContext nodes directly.
