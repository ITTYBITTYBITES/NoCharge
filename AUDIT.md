# NoCharge site audit

> **Historical note (August 18, 2026):** this audit describes the site as it was on August 15, 2026. The Adsterra banner, Smartlink fallback, sandboxed ad-host pages, and the advertising consent toggle described below were removed on August 18, 2026 and replaced with a single manual, responsive Google AdSense banner with Google Privacy & messaging consent. See the public changelog for the current state.

**Audit date:** August 15, 2026  
**Scope:** Home, Arcade, Guides, privacy, three game routes, three guide articles, ad host routes, metadata/indexing, accessibility, performance, security/privacy, game runtime, build/deployment, and mobile behavior visible from the source and production build.

## Executive summary

NoCharge has a good small-site foundation: static Astro output, very little first-party code, clear navigation, no accounts, and a focused visual system. The original build completed successfully and npm reported no known vulnerabilities.

The highest-impact functional issue was that two timed games began as soon as their scripts mounted. Because a 300×250 ad appears before the game stage, a player could reach Color Flip after losing or reach Word Tile Rush with an already-advanced grid. Memory Match also had a restart race that could throw while a mismatched pair was waiting to turn back over. These issues are fixed.

The follow-up hardening pass now blocks Google Analytics and Adsterra by default, offers separate analytics and advertising choices, supports withdrawal, sandboxes every ad without same-origin or top-navigation permission, and adds a turn-based nonvisual Color Flip mode. Twenty-three Playwright/axe tests are wired into the deployment gate. Remaining launch work is provider/legal confirmation, production ad-fill testing, manual assistive-technology testing, and HTTP response headers that GitHub Pages cannot configure.

## Work completed during the audit

### Gameplay and reliability

- Color Flip now waits at a **Start** screen instead of running behind the ad.
- Word Tile Rush now starts its row timer only after the first selected letter.
- Word Tile Rush pauses row drops while the tab is hidden or a word is being composed.
- Memory Match no longer lets a pending mismatch callback mutate a newly restarted board.
- Game-over states move focus to **Play again**, avoiding focus on hidden/disabled controls.
- Draft games are no longer emitted as public routes.

### Accessibility and input

- Added a keyboard-visible **Skip to main content** link.
- Raised header navigation targets to a minimum 44px height.
- Memory cards now preserve native button behavior and work with Enter/Space.
- Memory card names include position and hidden/revealed/matched state.
- Word Tile Rush cells are native buttons. Keyboard users can select letters and use a new **Submit** button.
- Color Flip’s canvas is focusable and supports Space or Enter without intercepting keys on unrelated buttons.
- Color Flip tiles and the player now show G/B/A/R labels, so play is not based on color alone.
- Corrected ad landmark semantics and removed deprecated iframe attributes.
- Improved home-card accent contrast for the green and blue games.
- Preserved the existing reduced-motion treatment.

### Home page and responsive UX

- Changed the ineffective desktop game-grid rule from one column to three columns at wide widths.
- Corrected game-card heading hierarchy from `h2` to `h3` under the Games section.
- Kept the one-column card layout at phone/tablet widths.
- Updated the trust copy so it no longer calls Google Analytics fully anonymous.

### Arcade, guides, and site content

- Rebuilt the homepage around a broader games-and-guides library while keeping three featured games.
- Added a dedicated Arcade page as the canonical home for the full game collection.
- Added a Guide library and three detailed, game-specific articles covering rules, controls, scoring, strategy, accessibility, and local storage.
- Expanded every game page with useful descriptions, game facts, and a direct link to its guide.
- Added breadcrumbs, cross-links, collection/article structured data, and updated navigation throughout the site.

### Privacy and third parties

- Replaced the incomplete privacy copy with explicit sections for local data, Google Analytics, Adsterra, retention, age, and contact.
- Added a browser-local analytics enable/disable control and a clear-game-data control.
- Suppressed ads on the Privacy page.
- Removed the Google Fonts request; the site now uses a local/system font stack.
- Added a strict-origin referrer policy.
- Responsive bottom ads now receive a `src` only when their breakpoint is visible. The old markup loaded both the 728×90 and 320×50 iframes even though CSS hid one, which could waste a request/impression.

### Search and sharing

- Added a generated XML sitemap covering Home, Arcade, all games, the guide library, all guide articles, and Privacy.
- Linked the sitemap from `robots.txt`; ad host pages remain disallowed.
- Added a branded 1200×630 social image and complete Open Graph/Twitter image metadata.
- Added `WebSite` structured data on the home page and `VideoGame` structured data on game pages.
- Added a custom, no-index 404 page without advertising.
- Added an Apple touch icon declaration.

### Engineering quality

- Added `astro check`, TypeScript, and `@astrojs/check`.
- Added the check to the deployment workflow before the production build.
- Updated the Astro 7 content schema import to the non-deprecated `astro/zod` entry point.
- Declared the Node version required by the installed Astro release.
- Added 15 Playwright/axe-core tests and made them a deployment gate.
- Added main/ad CSPs, a documented edge-header policy, and a standard security contact file.

## Validation results

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints |
| `npm run build` | Successful; 14 pages plus the sitemap endpoint built |
| npm audit | 0 known vulnerabilities |
| HTML validation | Passes recommended rules; deliberate inline style variables excluded |
| Internal recursive link check | 0 broken links |
| Runtime smoke tests | Memory, Word Tile Rush, visual/turn-based Color Flip, and consent state changes passed |
| Playwright/axe suite | 23 tests compile and are listed; Chromium execution is enforced in CI |
| Unknown URL | Returns the custom 404 document with HTTP 404 |
| Sitemap | 10 intended indexable URLs; no ad routes |
| Privacy route | No ad iframes |
| Responsive banner markup | Both frames have deferred URLs; no eager ad URL in initial HTML |
| Production artifact | About 404 KB raw across the expanded static site, including audio, icons, and a metadata-only social image; test files are not shipped |

A Lighthouse score is intentionally not claimed here. Core Web Vitals and ad behavior should be measured in a real browser against the deployed branch, with and without ad blocking and at least one slow mobile profile. Third-party ad auctions can materially change performance after the first-party build has loaded.

## Follow-up controls now implemented

- Optional analytics and advertising are denied by default and have separate choices.
- Consent is versioned, stored locally, available from every footer, and can be withdrawn without a reload.
- Google Analytics is not requested before analytics consent; withdrawal disables GA and removes first-party GA cookies.
- Ad frames and the configured Smartlink remain hidden and make no requests before advertising consent.
- Ad documents are sandboxed without same-origin or top-navigation permission and use source-validated messaging.
- Color Flip has a visible turn-based mode with announced current/next colors, native controls, scoring, and no moving-canvas timer.
- Twenty-three Playwright tests cover consent requests, responsive ads, Smartlink fallback, sandbox policy, game timing/races, keyboard input, content navigation, sitemap coverage, 404 behavior, and axe-core scans.
- The deployment workflow installs Chromium and runs those tests before uploading GitHub Pages.
- Main and ad documents ship separate meta CSPs; a security policy and `security.txt` are published.

## Remaining findings, prioritized

### High: confirm the consent implementation with the providers and launch regions

The code now follows a conservative prior-consent model, but a custom consent interface is not automatically an IAB Transparency and Consent Framework CMP. Confirm whether Adsterra requires a certified CMP or TCF consent string for the countries you plan to serve. The policy still needs owner/legal confirmation for operator identity, regional rights, analytics retention, personalized-ad status, users under 13, and US state sale/share treatment.

**Recommendation:** Treat provider and legal confirmation—not additional tag blocking—as the remaining compliance launch gate.

### High: verify live ad fill and Smartlink behavior with the sandbox

Sandboxing is implemented and blocks same-origin access and top-level navigation. The supplied Smartlink is configured as a consent-gated, user-initiated sponsored fallback. Because ad-provider creatives are dynamic, production testing must confirm banner fill, popup behavior, empty-slot reporting, and fallback conversion on iOS Safari and Android Chrome.

**Recommendation:** If sandboxed fill fails, keep consent gating but move ad documents to a dedicated origin such as `ads.nocharge.net` before considering any sandbox relaxation.

### Medium: perform manual assistive-technology testing

The new turn-based Color Flip mode provides a complete nonvisual interaction path, but automated tools cannot confirm announcement timing or usability.

**Recommendation:** Manually test it with NVDA/Firefox, JAWS/Chrome, and VoiceOver/Safari, including mode switching, color cycling, correct/wrong steps, focus after loss, and restart.

### Medium: apply HTTP response headers at the edge

Main and ad pages now include meta CSP and referrer policies. GitHub Pages still does not provide repository-configurable Permissions Policy, X-Content-Type-Options, frame-ancestor, COOP, or custom HSTS response headers. `SECURITY.md` contains the exact recommended edge policy.

**Recommendation:** Put the custom domain behind a configurable edge such as Cloudflare or Netlify and apply the documented response headers there. Test the CSP in report-only mode if the provider changes ad origins.

### Medium: revisit the above-game ad placement

A 300×250 ad sits between every game heading and stage. Timers now wait, so it no longer breaks play, but on a phone it still pushes the core action below the fold and weakens the “just play” promise.

**Recommendation:** Compare revenue and engagement for a below-stage rectangle, a smaller mobile unit, or one ad per session. Track game starts—not just page views—to measure the placement honestly.

### Medium: expose sound and pause controls

Games play short sounds but provide no mute preference. Color Flip has no in-game pause; Word Tile Rush only pauses implicitly when hidden or while a path is selected.

**Recommendation:** Add a persistent mute toggle backed by the existing preference helpers, plus explicit pause/resume for timed games. Pause when `document.visibilityState` changes and clearly announce the paused state.

### Medium: decide whether this is a real PWA

A web manifest and install icons exist, but there is no service worker or offline route caching. This is not harmful, but it creates an incomplete PWA signal.

**Recommendation:** Either add a small, versioned service worker that precaches the shell and game assets, or keep the manifest solely for install metadata and avoid making offline claims.

### Medium: strengthen game-page content for search and onboarding

Each game page has unique metadata and structured data, but only one short descriptive paragraph. Instructions are mostly inside client-rendered UI. Search engines and first-time visitors would benefit from concise static sections explaining controls, scoring, strategy, and storage.

**Recommendation:** Add 150–300 useful words per game under headings such as “How to play,” “Scoring,” and “Controls.” Keep it player-focused and avoid repetitive keyword copy.

### Low: repository and compatibility cleanup

- `color-mix()` and `:has()` target modern browsers. Add fallbacks only if older-browser support becomes a requirement.
- A single generic social card is adequate at launch; game-specific cards would improve sharing later.
- The direct mail link may attract spam as traffic grows; a privacy-preserving contact form could replace it later.

## Suggested release checklist

1. Have the consent model and privacy language approved for the intended launch regions and confirm Adsterra CMP/TCF requirements.
2. Let the GitHub deployment gate run all 23 Chromium/axe tests.
3. Deploy to staging and verify sandboxed banner fill plus the supplied Smartlink fallback on iOS and Android.
4. Run mobile/desktop Lighthouse with advertising both denied and allowed.
5. Test Safari iOS, Chrome Android, Firefox desktop, keyboard-only navigation, and the turn-based mode with a screen reader.
6. Verify no GA or ad request occurs before consent and that withdrawal stops future requests.
7. Apply the `SECURITY.md` response headers at a configurable edge when available.
8. Submit `https://nocharge.net/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
9. Monitor game starts, errors, consent rates, ad fill, and bounce rate for the first two weeks.
