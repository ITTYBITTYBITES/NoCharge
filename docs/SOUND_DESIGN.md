# Sound design

NoCharge uses a small procedural Web Audio sound bank. Oscillators, gains, and filters are created after a user gesture; no audio files, CDN, or third-party audio library is used. The distinction matters: `prefers-reduced-motion` changes visual motion only, while sound has its own controls.

Preference hierarchy is system/browser mute → `nocharge:pref:game-muted` → `nocharge:pref:sound-enabled` → `nocharge:pref:sound-volume`. Ambient is separately selected with `nocharge:pref:ambient-sound`. Defaults are sound enabled, volume 60, and ambient none. The toolbar mute button is the game-muted master override and covers effects and ambient.

Every event has a visual counterpart: move/place is a focus or placement state, flip is the card animation, merge is the tile bloom, hint is a highlight, error is a soft error tint, claim is a claimed box, and win is the existing result panel. Live announcements never depend on audio. We do not market this as immersive audio.

## Controls

Sound on/off exposes `aria-pressed`, volume is a labeled 0–100 slider, and Ambient offers None, Rainfall, Cafe, and White noise. Preferences are local-only. Ambient is filtered procedural noise, ducks during effects, and defaults off.
