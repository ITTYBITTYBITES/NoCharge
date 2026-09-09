# High-intensity games section — structural and UX audit, and integration plan

**Scope:** adding a high-intensity HTML5 / demo-prototype section to
[nocharge.net](https://nocharge.net) without diluting the calm, minimal
Quiet Arcade aesthetic.

**Date:** 2026-09-09
**Branch:** `arena/01a08622-nocharge` (from `0c90e7f`)
**Status:** architecture and runtime scaffolding proposed; ad network decision open (see §5)

---

## 0. Executive summary

The separation is achievable, and it is achievable *structurally* rather than
cosmetically — which matters, because the site's calm posture is currently
enforced by its build pipeline, not just its stylesheet. The Lab must be built
as a sibling that the calm site does not load, not as a theme applied to shared
pages.

Five findings drive the whole plan:

1. **There is no render loop anywhere in the repository today.** A grep for
   `requestAnimationFrame` across `src/` returns zero results, and only one file
   touches a canvas at all (`src/games/pass-the-picture/main.ts`, a drawing
   surface). Every one of the 26 games is DOM-based and turn-based or untimed.
   High-intensity games are therefore not a new *theme* — they are a new
   *capability*, and they need a loop, a canvas-sizing layer, and a frame-budget
   model before they need a colour scheme.

2. **The calm site's restraint is enforced by tests, not intentions.** Adsterra
   was removed on 2026-08-18 and four separate Playwright assertions now fail
   the build if it returns. Any second-network plan has to start with that
   register (§5.4), not with a script tag.

3. **Adsterra cannot deliver rewarded video.** Its self-serve product line is
   Popunder, Social Bar, Native Banners, Display Banners, Smartlink, and
   Interstitial. There is no rewarded format with a reward-granting callback —
   the closest thing is "Dynamic content (an alternative to VAST ads)", which is
   managed-accounts-only or on request. [1](https://adsterra.com/blog/quick-publishers-manual-to-ad-formats/)
   This is a blocking gap, not a preference.

4. **The `third-party: 0` performance budget applies to `/*`.** `budget.json`
   allows zero third-party resources on every path in the site. A Lab that loads
   any ad network breaks the Lighthouse budget unless the budget file is
   re-scoped per path (§5.5).

5. **Thin content is the real risk to the existing AdSense account.** The repo
   carries a dedicated `ADSENSE_THIN_CONTENT_AUDIT.md` and a hard 350-body-word
   floor enforced by `scripts/audit-content-quality.mjs`. Demo pages are exactly
   the kind of thin, indexable URL that jeopardises that standing. The default
   for `/lab/` must be `noIndex` (§6.3).

---

## 1. Architectural separation

### 1.1 Directory structure

The governing rule: **the calm site must not be able to load Lab code, and the
Lab must not be able to reach into shared game state except through the
existing controller interface.**

```text
src/
  pages/
    lab/
      index.astro                 # /lab/            — hub, noIndex, no AdSense
      [slug].astro                # /lab/<prototype>/ — noIndex, no AdSense
  content/
    lab/                          # NEW collection: prototype metadata
      <slug>.md
  lab/                            # NEW: Lab runtime, never imported by src/pages/*
    registry.ts                   # prototype loaders, own Vite chunks
    loop/
      raf-loop.ts                 # fixed-timestep loop          [built]
      canvas-stage.ts             # DPR-aware sizing + letterbox [built]
    hud/
      lab-hud.ts                  # Return to calm, FPS, mute    [built]
    ads/
      providers.ts                # vendor-agnostic contracts    [built]
      gates.ts                    # audio + input suspension     [built]
      lifecycle.ts                # orchestrator                 [built]
      adslots.astro               # reserved containers (TODO)
    mode/
      mode-toggle.ts              # localStorage preference      [built]
  components/
    ModeToggle.astro              # nav switch                   [built]
  styles/
    lab.css                       # Lab-only tokens and layout   [built]
```

Why `/lab/` and not `/overdrive/` or `/raw/`: the URL is permanent and the brand
name is not. Route the section at the most neutral of the three candidate names
and let the identity be a token set (`data-lab-theme`) that can change without a
redirect. See §4.

### 1.2 Why a separate `src/lab/` and not a branch of `src/games/`

`src/games/registry.ts` is one object mapping ids to dynamic imports. Adding
high-intensity games there would work, but it would:

- put Lab entries in the same iterable that drives `/arcade/` listing,
  `RecentlyPlayed`, the search index, and `allFacts()` in
  `src/lib/game-catalog.ts` — all of which would then need Lab-awareness;
- let Lab code be reachable from `src/pages/games/[slug].astro`, which is wrapped
  in `BaseLayout` with `showAds` defaulting to `true` (AdSense would appear on a
  page that must not carry AdSense).

A parallel registry under `src/lab/` keeps `src/games/` untouched and makes the
boundary auditable with one grep.

### 1.3 Shared surface, and the one shared file that changes

Lab prototypes implement the *same* `GameController` interface as calm games
(`src/games/shared/types.ts`), so the shared shell's pause, sound, and
fullscreen behaviour applies unchanged. That interface is:

```ts
interface GameController {
  destroy(): void;
  pause(reason?: PauseReason): void;
  resume(): void;
  isPaused(): boolean;
  restart?(): void;
}
```

Exactly one shared type gains a member. `PauseReason` becomes:

```ts
type PauseReason = 'player' | 'hidden' | 'consent' | 'fullscreen-change' | 'ad';
```

`'ad'` is in the shared union deliberately: the shared shell is what renders the
pause state, and a prototype paused by an ad must present identically to a calm
game paused by the consent dialog. `pause-recovery.ts` is updated so that no
Resume control can clear an `'ad'` pause — the visitor did not create it and must
not be able to end it from the game's own chrome:

```ts
if (reasons.has('ad')) {
  return 'Finish or close the advertisement to resume the game.';
}
```

---

## 2. Navigation mode toggle

### 2.1 Design decision: the Lab is opt-in, and the toggle is a reveal

The brief asks for a stateful directory/mode toggle. The important UX choice is
what the stored preference actually *does*. Storing a highlight is weak; a
visitor who never asked for the Lab would still see it in their navigation
forever, which is precisely the dilution the brief warns about.

So the preference **controls reach, not emphasis**:

| Stored preference | Lab link in primary nav |
| ----------------- | ----------------------- |
| `calm` (default)  | absent                  |
| `lab`             | present, every session  |

A visitor who never opts in gets byte-for-byte the navigation they have today.
"Return to calm" in the HUD resets the preference to `calm`, so the Lab
disappears again — the exit is a complete exit.

### 2.2 No flash of wrong navigation

Two document attributes carry different information, and conflating them is the
usual cause of a toggle that flickers:

| Attribute                | Set by        | Meaning                              |
| ------------------------ | ------------- | ------------------------------------ |
| `data-site-mode`         | the route (server) | Which section this page belongs to |
| `data-site-preference`   | `localStorage`    | What the visitor chose            |

`data-site-mode` is rendered server-side, so it is correct on the first byte and
cannot flash. `data-site-preference` is applied by a blocking bootstrap script
in `<head>` (~200 bytes, `src/lab/mode/mode-toggle.ts`). Anything larger belongs
in the bundle; this one is on the critical path of every page.

### 2.3 Markup

Two real links, so the control navigates with JavaScript disabled. The
controller only adds persistence — it writes to `localStorage` *before* the
browser follows the href, so the destination renders with the correct nav on its
first paint.

```html
<div class="mode-switch" data-mode-switch role="group" aria-label="Site mode">
  <a class="mode-switch__option" data-mode-option="calm" href="/" aria-current="true">
    <span class="mode-switch__dot" aria-hidden="true"></span>Calm
  </a>
  <a class="mode-switch__option mode-switch__option--lab" data-mode-option="lab" href="/lab/">
    <span class="mode-switch__dot" aria-hidden="true"></span>Lab
  </a>
</div>
```

The Lab option stays in the DOM for every visitor — so it can be linked and
discovered — but occupies no space until the preference allows it:

```css
.mode-switch__option--lab { display: none; }
:global(html[data-site-preference='lab']) .mode-switch__option--lab {
  display: inline-flex;
}
```

Layout is flexbox: the switch is a pill, the options are inline-flex rows with a
status dot. `aria-current="true"` marks the active section, which is the correct
semantic for a navigation choice (a `role="switch"` would be wrong here — this
is a choice between two destinations, not an on/off state).

### 2.4 State handling

`src/lab/mode/mode-toggle.ts` — key resolves to `nocharge:pref:site-mode` via
the shared `prefKey()` helper, so it sits with every other stored preference.

Failure modes are all biased toward calm:

- missing or malformed JSON → `calm`
- storage throws (private mode, disabled storage) → `calm` for what is *stored*,
  while still honouring the click for the current session
- no `localStorage` at all → `calm`

---

## 3. Canvas viewport, HUD, and responsive layouts

### 3.1 Viewport

`src/styles/lab.css` sizes the frame with `dvh`/`dvw`, not `vh`/`vw`:

- `100vh` on mobile includes the URL bar, so a full-height stage is either
  clipped or scrollable while the bar animates.
- `100vw` causes horizontal overflow on desktop whenever a scrollbar exists —
  which the calm site has already been bitten by: `global.css` carries a
  `min-width: 0` patch with a comment explaining that a stale 728px ad creative
  once widened `.site-main` and clipped the centred layout.

`overscroll-behavior: none`, `touch-action: none`, and `user-select: none` on the
frame kill rubber-banding, pull-to-refresh, and the double-tap zoom that would
otherwise swallow rapid taps.

### 3.2 Canvas backing store

`src/lab/loop/canvas-stage.ts`. A canvas has two independent sizes and getting
either wrong is visible:

- backing store = CSS size × `devicePixelRatio`, **clamped to 2**. A 3× phone
  rendering at native density is a space heater; capped at 2 it is sharp and
  still holds 60fps.
- `ResizeObserver` on the element, not `window.resize` — the stage also changes
  size when an ad container fills, and on iOS the orientation change is not
  reliably preceded by a resize.
- integer dimensions, and `setTransform(dpr, 0, 0, dpr, 0, 0)` so games draw in
  CSS pixels and never think about DPR.
- a 0×0 measurement (hidden container) is ignored rather than applied.

`fitAspect()` letterboxes to a fixed aspect so difficulty is identical on every
device — the honest way to keep a fast game fair.

### 3.3 Loop

`src/lab/loop/raf-loop.ts`. Fixed timestep with an accumulator, `render(alpha)`
for interpolation, and a clamp (`maxFrame`, 0.25s) so a backgrounded tab does
not resume by simulating ten seconds in one frame.

The ad-critical detail: **`start()` resets the clock.** Without that, the gap
between `stop()` and `start()` — an ad playing, a tab in the background — is
replayed as one enormous frame and the player dies the instant they resume. This
is covered by a test.

### 3.4 HUD

`src/lab/hud/lab-hud.ts` — Return to calm, FPS, mute. Nothing else.

- The HUD is `position: absolute` over the stage with `pointer-events: none` on
  the container and `auto` on its children, so it does not block gameplay across
  the whole top of the screen.
- Fades to 0.18 opacity after 2.6s idle, returns on any input. It fades rather
  than slides: movement in the corner of a fast game is far more distracting
  than a change in opacity.
- **Never dims while it contains focus** (`is-hud-idle:focus-within`). Hiding a
  focused control is a WCAG 2.4.7 failure, not a style choice.
- FPS updates at 2Hz, not 60Hz — writing the DOM every frame would itself cost
  frames.
- Escape is bound in the HUD, not the game, so every prototype exits the same
  way even ones that swallow arrow keys.
- All targets are ≥44px, matching the calm site's touch-target rule, except in
  short landscape where they drop to 36px to give the stage back its height.

### 3.5 The three layouts

Portrait (default):

```text
┌─────────────────┐
│  HUD (fades)    │
│                 │
│     stage       │  grid-area: stage
│                 │
│ ── touch band ──│  --lab-touch-band: 34%
├─────────────────┤
│  320×50 banner  │  grid-area: ad-bottom
└─────────────────┘
```

Desktop / tablet landscape (`orientation: landscape` and `min-width: 64rem`):

```text
┌──────────────────────────┬───────────┐
│  HUD                     │           │
│        stage             │ 300×600   │  grid-area: ad-rail
│                          │   rail    │
├──────────────────────────┴───────────┤
│            728×90 leaderboard        │
└──────────────────────────────────────┘
```

Mobile landscape (`orientation: landscape` and `max-height: 30rem`) — the case
most implementations get wrong. An 812×375 viewport has 375px of height; a 90px
leaderboard plus a 50px banner plus safe areas leaves almost nothing to play in.
**In short landscape both ad containers are dropped entirely and the touch
controls move to the left and right edges.** Ads do not get to make an action
game unplayable.

### 3.6 Touch controls cannot be overlapped, structurally

Advertisements can only ever occupy the `ad-bottom` and `ad-rail` grid areas.
`stage` is a different grid area, so overlap is not a matter of getting the
z-index right — it is not expressible in the layout. The touch band is a
declared contract (`--lab-touch-band`) that reserves the bottom 34% of the
stage in portrait; in short landscape it is zeroed and the controls move to the
edges, clear of every thumb zone.

---

## 4. Brand: three naming and identity pairs

Route the section at `/lab/` under all three; the name is a token set
(`data-lab-theme`), not a URL, so the choice is reversible without a redirect.

All three deliberately avoid the calm site's emerald `#0f9d58`. The fastest way
to dilute the Quiet Arcade is to make the loud section look like it.

### A. The Lab — instrument panel

| | |
|---|---|
| Accent | Sodium amber `#ffb020` |
| Ground | `#0a0a0c` / panel `#14141a` |
| Type | System sans, weight 650, tabular numerals |
| Feel | Bench equipment, oscilloscope, readouts |
| Says | "This is a workbench. Things here are measured, not finished." |

Strongest fit for demo and experimental prototypes — which is what the section
actually contains. It justifies roughness instead of apologising for it, and it
is the only one of the three that can carry an FPS counter without irony.
**Recommended.**

### B. Overdrive — full intensity

| | |
|---|---|
| Accent | Hot magenta `#ff2d6f` |
| Ground | `#08060d` / panel `#16101c` |
| Type | System sans, weight 800, tight tracking |
| Feel | Synthwave, afterburner, motion |
| Says | "This is the loud one." |

The most honest name for genuinely high-intensity action games, and the furthest
possible from calm. Risk: it promises polish. A rough prototype under
"Overdrive" looks broken rather than experimental. Best if the section ends up
curated and finished rather than open.

### C. Raw Engine — debug build

| | |
|---|---|
| Accent | Acid lime `#c9ff2e` |
| Ground | `#000000` / panel `#0c0c0c` |
| Type | Monospace, hairline borders, wireframe |
| Feel | Unstyled build, wireframes, debug overlay |
| Says | "You are looking at the machinery." |

Cheapest to build — no art assets, hairlines and wireframes only — and the FPS
counter becomes a design element rather than an apology. Risk: monospace and
hairlines read as "unfinished" to a general audience, and can scan as a
developer tool rather than a place to play.

**Recommendation:** ship the section as **The Lab** (amber) with all three token
sets present in `lab.css`. The other two are one attribute away, so the name can
be settled on real traffic rather than argued about in advance.

---

## 5. Monetisation: architecture, and one blocking gap

### 5.1 Unchanged commitment

`/lab/` carries **no AdSense**. Not a different slot — none. The AdSense tag is
already gated by `isProd && showAds` in `BaseLayout`; Lab routes pass
`showAds={false}`. The existing e2e test that asserts ad-free paths
(`tests/e2e/adsense.spec.ts`) should gain the `/lab/` routes so this is enforced
rather than remembered.

### 5.2 The blocking gap: Adsterra has no rewarded video

The stated plan is "Adsterra for banner, rewarded video for this area". The
banner half is straightforward. The rewarded half does not currently exist as an
Adsterra product.

Adsterra's self-serve line is Popunder, Social Bar (In-Page Push, Icon
Notifications, Custom Widget, Interstitial), Native Banners, Display Banners
(160×300, 160×600, 300×250, 320×50, 728×90, 468×60), Smartlink, and
Interstitial. [1](https://adsterra.com/blog/quick-publishers-manual-to-ad-formats/)
The only video-adjacent item is "Dynamic content (an alternative to VAST ads)",
available to managed accounts or on request. [2](https://adsterra.com/blog/best-online-display-ads/)

More importantly, a rewarded product is not just a video — it is a **reward-
granting callback**. None is documented. Options, in order of fit:

| Option | Fits? | Notes |
|---|---|---|
| **Dedicated rewarded-video SDK (e.g. ayetstudios HTML5)** | **Best** | Real client-side *and* server-side signed reward callbacks, iframe isolation, automatic TCF2/GDPR handling. [3](https://docs.ayetstudios.com/v/product-docs/rewarded-video/web-integrations/rewarded-video-sdk-for-html5) |
| Google Ad Manager rewarded ads for web (GPT) | Good | `rewardedSlotReady` / `rewardedSlotGranted` / `rewardedSlotClosed`; skippable, user-initiated. Needs a GAM account. **No server-side verification on web** — rewards are granted on a client event, so they must be low-value. [4](https://support.google.com/admanager/answer/9116812) |
| AdSense Offerwall "Rewarded ad" choice | Good but Google | The only AdSense-native rewarded path on web, no code changes. [5](https://support.google.com/adsense/answer/12726063) Excluded by the "no AdSense here" decision. |
| Adsterra managed / VAST dynamic content | Weak | No reward callback; you would grant on a completion event with no verification. |

**This is why the provider layer is an interface.** `src/lab/ads/providers.ts`
defines `BannerProvider` and `RewardedProvider` and ships `nullBannerProvider` /
`nullRewardedProvider`, which resolve everything as unavailable. The loop,
audio, and input hooks are therefore built, tested, and shippable *before* the
network decision is made — and swapping in a winner is one new file, not a
rewrite.

### 5.3 Reward rules that apply whichever network wins

Google's policies for ad units that offer rewards apply to any Google-served
reward, and they are the right rules regardless: [6](https://support.google.com/adsense/answer/9121589)

- The reward must be **non-monetary, non-transferable, and usable only inside
  NoCharge**. Extra lives and demo unlocks both qualify.
- **Clear disclosure before each instance** of what is required and what is
  earned.
- Only served **after an affirmative opt-in** — a tap on a button that means yes.
  This is why `playRewarded()` is only reachable from a player tap and nothing in
  the lifecycle may trigger an ad on its own.
- Must be **skippable or dismissible**, and skipping must not impede normal use.
- The reward must actually be delivered on completion.

One design consequence worth stating plainly: **a rewarded "extra life" is in
tension with the Quiet Arcade promise** of "no lives, energy refills, or paywalls
to continue" (`src/content/learn/what-is-quiet-arcade.md`). That promise is
about the calm arcade, and the Lab is explicitly a different contract — but the
Lab must say so on its own pages rather than quietly contradicting the Learn
content. Rewarding a *demo unlock* or a *cosmetic* is cleaner than rewarding a
continue.

### 5.4 What breaks if a second network is added — the CI register

Adsterra was removed on 2026-08-18 and its absence is now enforced. Every one of
these **fails the build** today:

| Location | Assertion | Effect |
|---|---|---|
| `tests/e2e/adsense.spec.ts` — *"no Adsterra or Smartlink implementation artifacts remain"* | scans `/`, `/games/memory-match/`, `/privacy/`, `/advertising/` for `highperformanceformat`, `harryinspectionlucy`, `adsterra.com`, `atoptions`; also `.ad-slot` count 0 and `[data-ad-banner] iframe` count 0 | Network script on those four paths fails the build. **Lab paths are not yet in the scan list — they must be, or the guard silently stops meaning what it says.** |
| `tests/e2e/adsense.spec.ts` — *"the old Adsterra ad-host routes are gone"* | `/ads/*` must 404 | Do not reintroduce sandboxed ad-host pages. |
| `tests/e2e/adsense.spec.ts` — *"public/ads.txt is the exact AdSense line"* | `lines).toEqual([ADS_TXT_LINE])` — exactly one record | **Adding an Adsterra `ads.txt` entry breaks this.** The test must become "exactly one AdSense record plus an allow-list", not "exactly one line". |
| `tests/e2e/consent.spec.ts` | `'advertising' in stored` must be false; modal must contain exactly one checkbox | Reintroducing a site-owned advertising toggle breaks the analytics-only consent model. |

Two more that are not test failures but will bite:

- **CSP.** `BaseLayout`'s `Content-Security-Policy` allowlists Google domains
  only. A network needs entries in `script-src`, `img-src`, `connect-src`, and
  `frame-src`. Add them narrowly and prefer a per-route header over widening the
  global policy.
- **Consent.** `AUDIT.md` already flags the unresolved question: *"Confirm
  whether Adsterra requires a certified CMP or TCF consent string for the
  countries you plan to serve."* The current model is analytics-only consent
  plus Google Privacy & messaging for advertising. A non-Google network in the
  EEA needs its own consent basis, and Google's consent message does not supply
  one. **This is the largest open legal item in the plan.**

### 5.5 Performance budget

`budget.json` currently applies `third-party: 0` to `/*`. Re-scope it so the calm
site keeps its zero and the Lab gets an explicit, defended allowance:

```json
[
  { "path": "/*",          "resourceCounts": [{ "resourceType": "third-party", "budget": 0 }] },
  { "path": "/lab/*",      "resourceCounts": [{ "resourceType": "third-party", "budget": 6 }],
                           "resourceSizes":  [{ "resourceType": "script", "budget": 500 }] }
]
```

`.lighthouseci` also needs `/lab/` URLs added — today it only collects the calm
pages, so a Lab regression would ship unnoticed.

### 5.6 Ad container specification

Both containers are reserved grid tracks with an explicit `min-height`, so a
creative that fills late cannot shift the stage (the CLS budget is 0.1). If a
slot stays empty the track keeps its space and the stage is simply shorter —
never reflowed. The "Advertisement" label stays visible even when the slot is
empty, so an ad is never mistaken for site content.

| Breakpoint | Container | Reserved | Notes |
|---|---|---|---|
| Portrait | `.lab-ad--bottom` | 320×50 + safe area | Below the touch band |
| Landscape ≥64rem | `.lab-ad--bottom` | 728×90 | Leaderboard |
| Landscape ≥64rem | `.lab-ad--rail` | 300×600 (or 160×600) | Own grid column |
| Landscape <30rem height | both | — | **Both hidden** |

Never: sticky, floating, auto-refreshing, or top-level-navigating. The calm site
documents these as absent (`/advertising/`); the Lab inherits that commitment.

---

## 6. Ad lifecycle integration hooks

`src/lab/ads/lifecycle.ts` is the single place where "an ad is on screen" is a
known state. Three gates, in a fixed order.

### 6.1 Order matters, in both directions

**Hold:** input → audio → loop.

Input is suspended first because a keypress that arrives during the ad
transition would otherwise be simulated by one last frame and kill the player
mid-handoff.

**Release:** loop → audio → input, and only if it was running.

### 6.2 The four guarantees

1. **`finally`, not `then`.** An SDK that throws, rejects, or never settles must
   not leave the game permanently frozen with input swallowed. Every gate is
   released on the way out, whatever happened.

2. **The loop only restarts if it was running.** `hold()` captures
   `loop.isRunning()` *before* calling `stop()` — after that the information is
   gone. Starting a loop that the player, a hidden tab, or the consent dialog had
   already paused would silently override a pause the user asked for.

3. **Audio is ramped *and* suspended.** Ramping the master gain to zero only
   silences it; the context keeps burning CPU and a competing video ad can click
   on the way out. Suspending without the ramp cuts audio abruptly, which is
   audible as a pop on every transition. So: ramp to 0 over 20ms, then
   `context.suspend()`. On restore, only `resume()` a context that was running
   before — resuming a suspended-by-policy context is an autoplay violation and
   the browser will simply refuse. Ambient soundscapes use the existing
   `suspendAmbientForVisibility()` / `resumeAmbientAfterVisibility()` pair so a
   soundscape that was never started does not start on resume.

4. **Input is swallowed in the capture phase.** Game listeners sit on the canvas
   or document, so a bubble-phase blocker would fire after the game had already
   handled the event. `stopImmediatePropagation()` in capture means the game
   never sees it. Focus is never moved — stealing focus from the ad's own close
   button would make the ad non-dismissible, which is a policy problem, not just
   a UX one.

### 6.3 Usage

```ts
const lifecycle = createAdLifecycle({
  loop,
  audio: createWebAudioGate(),
  input: createInputGate(),
  onBeforeAd: () => hud.wake(),
  onAfterAd: (_placement, outcome) => {
    if (outcome?.granted) grantExtraLife();
  },
});

// Only ever from a player tap. Never from a timer, a state change, or a
// game-over handler: rewarded ads must be affirmatively opted into.
button.addEventListener('click', async () => {
  const ready = await provider.load('extra-life');
  if (!ready) return; // no creative — do not show a reward offer you cannot honour
  const outcome = await lifecycle.playRewarded(provider, 'extra-life');
});
```

Concurrent requests are refused rather than double-held, so two rapid taps
produce exactly one suppress/restore pair.

### 6.4 Integration with the shared shell

For a full-screen interstitial (not rewarded), the Lab raises the shared pause
reason rather than inventing a second pause system:

```ts
addPauseReason('ad');   // shared shell renders the pause state
lifecycle.hold();       // gates
// ... ad plays ...
lifecycle.release();
removePauseReason('ad', 'Game resumed.');
```

Because nothing in `pause-recovery.ts` deletes `'ad'`, the shared Resume control
cannot lift it — it reports *"Finish or close the advertisement to resume the
game."*

---

## 7. Content and SEO

This is where the plan is most likely to damage the existing site if handled
casually.

- **`noIndex` the entire section.** `scripts/audit-content-quality.mjs` enforces
  a 350-body-word floor on phase-five content, and `ADSENSE_THIN_CONTENT_AUDIT.md`
  exists because thin pages are the identified risk to the AdSense account. Demo
  pages are exactly thin pages. Default every `/lab/` route to
  `noIndex={true}` and drop them from the sitemap (`validate-sitemap.mjs`
  already asserts no-index routes are absent from it). Promote a prototype out
  of `noIndex` only once it meets the same editorial bar as a calm game.
- **No `VideoGame` schema until it is real.** `src/pages/games/[slug].astro`
  emits `VideoGame` + `FAQPage` structured data per game. A prototype should not
  inherit that; `scripts/inspect-structured-data.mjs` validates it site-wide.
- **Keep the Lab out of the search index and the game catalog.** `src/lib/search.ts`
  builds `search-index.json` from the game collection; `game-catalog.ts`
  computes `allFacts()` and related games. Neither should see `src/content/lab/`.

## 8. Build order

| # | Step | Depends on |
|---|---|---|
| 1 | `PauseReason` + `ad` handling in shared shell | — |
| 2 | Mode toggle + bootstrap + `ModeToggle.astro` | 1 |
| 3 | `lab.css`, canvas stage, loop, HUD | 2 |
| 4 | `/lab/` hub and one prototype, `noIndex`, `showAds={false}` | 3 |
| 5 | **Decide the rewarded provider** (§5.2) | — |
| 6 | `adslots.astro` + provider adapter | 4, 5 |
| 7 | Re-scope `budget.json`, add Lab URLs to `.lighthouseci` | 4 |
| 8 | Update the four CI assertions and `ads.txt` (§5.4) | 5, 6 |
| 9 | **Resolve the EEA consent basis for the non-Google network** (§5.4) | 5 |

Steps 1–4 and 7 are unblocked now and prove the architecture works with no ad
network at all. Step 5 gates everything commercial, and step 9 gates launch.

---

## 9. What is built in this branch

| File | State |
|---|---|
| `src/lab/loop/raf-loop.ts` + tests | done, 7 tests |
| `src/lab/loop/canvas-stage.ts` | done |
| `src/lab/hud/lab-hud.ts` | done |
| `src/lab/ads/providers.ts` | done (null providers only) |
| `src/lab/ads/gates.ts` | done |
| `src/lab/ads/lifecycle.ts` + tests | done, 6 tests |
| `src/lab/mode/mode-toggle.ts` + tests | done, 11 tests |
| `src/components/ModeToggle.astro` | done |
| `src/styles/lab.css` | done (3 themes, 3 layouts) |
| `src/games/shared/types.ts` | `PauseReason` gains `'ad'` |
| `src/games/shared/pause-recovery.ts` | ad-specific blocked message |
| `src/layouts/BaseLayout.astro` | mode bootstrap in `<head>` |
| `/lab/` routes | **not started** — blocked on step 4 |
| Ad provider adapters | **not started** — blocked on step 5 |

34 unit tests pass; `astro check` reports 0 errors, 0 warnings.

---

## Sources

1. [Adsterra — essential ad formats for publishers](https://adsterra.com/blog/quick-publishers-manual-to-ad-formats/)
2. [Adsterra — best online display ads](https://adsterra.com/blog/best-online-display-ads/)
3. [ayetstudios — Rewarded Video SDK for HTML5](https://docs.ayetstudios.com/v/product-docs/rewarded-video/web-integrations/rewarded-video-sdk-for-html5)
4. [Google Ad Manager — traffic rewarded ads for web](https://support.google.com/admanager/answer/9116812)
5. [Google AdSense — set up a "Rewarded ad" user choice (Offerwall)](https://support.google.com/adsense/answer/12726063)
6. [Google AdSense — policies for ad units that offer rewards](https://support.google.com/adsense/answer/9121589)
7. [Coalition for Better Ads — interruptive interstitials (mobile apps)](https://www.betterads.org/mobile-app-interruptive-interstitials)
8. [Google AdSense — video publisher policy change log](https://support.google.com/adsense/answer/9336650)
