# Advertising state

**Status: display advertising is off, and monetization is affiliate-only.**
No ad network, no ad banner, no ad placeholder, no ad script, and no advertising
consent tag is rendered by the shipped build.

> Superseded in part: the plan below describes the *legacy* AdSense path, which is
> retained but retired. Revenue now comes from affiliate links — Awin
> (`docs/AWIN_INTEGRATION.md`) plus Amazon Associates. Adsterra has been deleted
> from the codebase, not just disabled.

Two implementations are retained in the repository and can be switched on by
build flag. Neither has any effect when the flag is unset, and **no**
placeholder, reserved space, or "Advertisement" label is rendered while off.

| Network | Flag | Default | Where |
| --- | --- | --- | --- |
| Google AdSense (calm site, one banner) | `PUBLIC_ADSENSE_ENABLED=true` | off | `src/config/adsense.ts` |
| Adsterra banner (Lab only) | `PUBLIC_ADSTERRA_ENABLED=true` + placement keys | off | `src/config/adsterra.ts` |

## What "off" means, concretely

With both flags unset:

- `BaseLayout` renders no `<AdSenseBanner />`, and loads neither the
  `adsbygoogle.js` tag nor the Google Privacy & messaging tag
  (`BaseLayout.astro`, `adSenseOn`).
- The footer renders no "Privacy and cookie settings" control, because there is
  no Google advertising consent message to reopen. The analytics choice control
  stays.
- The Lab (`/lab/*`) renders no ad containers at all. `adslots.astro` emits
  nothing, and the `.lab-frame--ads` grid tracks are absent, so the stage fills
  the frame (`src/lab/ads/adslots.astro`, `src/styles/lab.css`).
- `/advertising/` and `/privacy/` say that no advertising network is active,
  instead of describing a banner that does not exist. Their AdSense sections
  are kept and shown only when the flag is on.
- `public/ads.txt` is left in place. An `ads.txt` record does not load anything;
  keeping it means a re-enable needs no file change.

Analytics (GA4) is independent of this and keeps its own consent gate.

## Restoring AdSense

1. Set `PUBLIC_ADSENSE_ENABLED=true` in the build environment.
2. Confirm the publisher id and slot id in `src/config/adsense.ts`, and that
   `public/ads.txt` still carries the matching record.
3. Re-enable the ad assertions in `tests/e2e/adsense.spec.ts` — the "off"
   assertions at the top of that file are the current expectation, and they
   encode the fact that the banner is off.
4. Update `/advertising/`, `/privacy/`, `/changelog/`.

## Do not ship these

- An empty ad container, a reserved blank band, or a visible "Advertisement"
  label with nothing in it. An unfilled slot is a broken advert, not a neutral
  placeholder.
- An ad unit that the active network has not approved. Only render units whose
  status in the network dashboard is **Active**.
