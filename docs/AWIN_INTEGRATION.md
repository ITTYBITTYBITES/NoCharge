# Awin integration

Publisher **3025417**, site `https://nocharge.net/`, MasterTag
`https://www.dwin2.com/pub.3025417.min.js`, Convert-a-Link **on** in the
dashboard.

Display advertising (AdSense, Adsterra) has been retired in favour of this
program. Nothing here loads unless `PUBLIC_AWIN_ENABLED=true`.

---

## 1. Why the MasterTag is not a plain `<head>` script

Awin's install instructions say: put the tag in `<head>`, done. That is not
shippable on this site, for three reasons:

| Reason | Consequence |
| --- | --- |
| The tag sets the `awc` tracking cookie | A non-essential cookie needs a consent basis in the UK/EEA before it is set |
| The site's CSP is `'self'`-first, per-route | `dwin2.com` is added to `script-src`/`img-src`/`connect-src` **only** when the flag is on (`AWIN_CSP_SOURCES`) |
| The Playwright + validator suite asserts no third-party request before consent | A static tag tag would fail that assertion, correctly |

So `src/components/AwinMasterTag.astro` injects the tag at runtime, and only when
the stored consent has `analytics: true` (or the visitor grants it mid-session).
Denied visitors make **zero** requests to `dwin2.com`.

### The consent decision, stated plainly

The site has one optional consent purpose, `analytics`. Awin tracking is gated
by it and disclosed under it: the consent dialog's checkbox now reads
**"Analytics and affiliate tracking"** in all 8 locales, and its body text names
Awin and says no commission is earned without it.

This is defensible but it is a compromise, and it is recorded as such:

- **It is honest**: the copy says exactly what the toggle does.
- **It is not purpose-optimal**: someone who wants analytics but not affiliate
  cookies cannot express that. The clean fix is consent schema **v2** with a
  separate `affiliate` purpose, a three-checkbox dialog, and a
  `nocharge:consentchange` consumer in `AwinMasterTag`. That is a UI + copy +
  test change across 8 locales; do it before scaling volume, not after.
- **EEA/UK legal review**: if compliance review asks for a TCF-registered CMP
  that lists Awin as a vendor, the MasterTag gate is the single place to change.

## 2. Two link shapes, and why both exist

| `mode` | Rendered `href` | When to use |
| --- | --- | --- |
| `cread` (default) | `https://www.awin1.com/cread.php?awinmid=…&awinaffid=3025417&clickref=…&ued=<encoded merchant URL>` | Every generated module. Deterministic, works with the MasterTag blocked, assertable in CI |
| `direct` | the bare merchant URL | Links written by hand in markdown. Attribution happens in the browser via Convert-a-Link, so it requires consent |

With Convert-a-Link enabled, `cread` links are **not** double-processed (it skips
links already pointing at `awin1.com`), so the explicit form is safe in either
mode. Prefer it: a `cread` link still pays if the MasterTag never loads, if the
visitor blocks third-party scripts, or if the CSP later tightens.

**Convert-a-Link caveat:** it rewrites outbound links in the browser. That means
a hand-written `https://www.amazon.com/...` link is *not* silently rewritten into
an Awin click (Amazon is not an Awin advertiser), but a hand-written link to any
Awin advertiser *is*. Do not rely on it for accuracy — write `cread` links, and
treat Convert-a-Link as a safety net for stragglers.

## 3. Where the code lives

```
src/config/awin.ts              publisher id, switches, merchant registry, CSP sources
src/lib/awin.ts                 pure link building + validation (unit tested)
src/lib/awin.test.ts            16 unit tests: URL shape, ids, clickref, labels, rel
src/components/AwinLink.astro   the only sanctioned paid link. Throws at build time
src/components/AwinMasterTag.astro  consent-gated tag injection
src/components/GearPicks.astro  the module that replaced the display-ad band
src/components/setup/AffiliateDisclosure.astro  disclosure (panel | note variants)
scripts/validate-awin.mjs       dist-level contract check, no browser needed
tests/e2e/awin.spec.ts          browser contract check
```

### Build-time failures, not silent revenue leaks

`AwinLink.astro` throws during the build when:

- the merchant key is not in the registry;
- the merchant is not `approved`;
- the merchant has no confirmed MID — **a guessed MID pays nobody, so the
  component refuses to render at all**;
- an explicit `merchantId` disagrees with the registry (the copy/paste failure
  that silently attributes to the wrong advertiser);
- the destination is not absolute `https`;
- the `clickref` is not `[A-Za-z0-9._-]{1,64}`;
- the label breaks editorial policy: no `(paid link)` marker, or a
  price/deal/stock/rating/superlative claim;
- the generated href is not attributable back to `3025417` + that MID.

## 4. Turning it on

```bash
PUBLIC_AWIN_ENABLED=true
PUBLIC_AWIN_MID_BRKOX=12345      # Awin → Advertisers → MID column
PUBLIC_AWIN_MID_CANGYU=12346
```

Then:

1. **Verify each merchant's destination paths.** `AWIN_MERCHANTS[].destinations[].path`
   ships with placeholder paths (`/collections/lighting-kits`,
   `/collections/desk-accessories`). Replace them with real category or product
   URLs on the advertiser's domain. A path that 404s is a broken paid link.
2. **Confirm the merchant domains** in `AWIN_MERCHANTS[].domains`. They must be
   the registrable domains the advertiser actually links to, or the `direct`
   mode allowlist is wrong.
3. `npm run build && npm run verify:build` — `validate:awin` reports how many
   paid links rendered and fails on any contract violation.
4. Check an outbound link in the Awin dashboard (Reports → clicks) with the
   `clickref` you expect, e.g. `setup-bias-lighting-behind-a-monitor`.

### Rollback

Unset `PUBLIC_AWIN_ENABLED` (or set it to `false`) and redeploy. No code change,
no migration: the components render nothing, the MasterTag is not requested, and
the CSP reverts to `'self'`-first.

## 5. Placement map

| Surface | Module | Rationale |
| --- | --- | --- |
| `/setup/*` (210 buyer-intent articles) | Topic-mapped block after the criteria, before the FAQ | Highest intent on the site. `AWIN_MERCHANTS_BY_TOPIC` maps topic → merchants; a lamp article never recommends a monitor arm, and an unmapped topic shows nothing |
| `/guides/*` (26) | Compact module after the rules, before the FAQ | Reader has finished the rules before meeting a commercial link |
| `/articles/*` (47) | One compact panel after the prose | Explainers, not buyer guides — no in-prose injection |
| All other eligible pages (`showAds`) | Footer module in place of the old ad band | Reclaims the ad slot with editorial content |
| `/games/*` | **Footer only, never inside `GameShell`** | Non-disruptive by requirement; `validate:awin` fails if a paid link appears inside `data-game-shell`, `data-game-viewport`, `data-recently-played`, `game-controls` or the Lab frame |
| `/privacy/`, `/terms/`, `/about/`, `/lab/*`, `/my-arcade/`, `/search/` | none | `showAds={false}` unchanged |

## 6. Verification

```bash
npm run validate:awin      # dist contract, runs inside verify:build
npx vitest run src/lib/awin.test.ts
npx playwright test tests/e2e/awin.spec.ts
```

`validate:awin` asserts, on every built page:

1. No static `<script src="…dwin2…">` (the tag must be consent-gated).
2. At most one MasterTag URL reference per page.
3. Every `a[data-awin-link]`: `rel="sponsored nofollow noopener noreferrer"`
   exactly, `target="_blank"`, `data-awin-pid="3025417"`, numeric
   `data-awin-mid` matching the `awinmid` in the URL, `(paid link)` in the text,
   `https`, and a well-formed `cread.php` URL (or an allowlisted merchant host).
4. Disclosure present and **before** the first paid link.
5. No paid link inside a game surface.
6. No retired ad markup (AdSense, Adsterra, `data-ad-banner`, `data-lab-ad`).
7. Awin hosts in the CSP only when the tag loader is present.

## 7. Compliance checklist (owner)

- [ ] `PUBLIC_AWIN_ENABLED` and both MIDs set in the deploy environment only
      (never committed).
- [ ] Merchant destination paths verified by hand; no 404s.
- [ ] Every article with a paid link also renders the disclosure first
      (`validate:awin` enforces the order, not the merchant's truthfulness).
- [ ] `/advertising/` names the current networks: Awin **and** Amazon
      Associates.
- [ ] Privacy page documents the `awc` cookie, its purpose, and the toggle that
      controls it.
- [ ] Consent dialog copy says Awin is tracked under the analytics choice
      (done in 8 locales).
- [ ] Awin programme terms read: no self-purchases, no coupon/deal claims, no
      price scraping, no bidding on advertiser brand terms, no email/PPC
      promotion of advertiser offers without written approval.
- [ ] Editorial policy reviewed: it forbids price, discount, stock, availability,
      merchant rating and review-excerpt claims — `assertAwinLabel()` enforces
      this on link labels; keep it true for body copy too.
- [ ] Quarterly: re-check merchant approval status in the dashboard and re-run
      `validate:awin`.

## 8. Known limitations

- **No merchant images or widgets.** The editorial policy forbids merchant
  logos/images, so conversions rely on text links only. If that policy is
  relaxed, `GearPicks` is the single component to extend (Awin product widgets
  would also need a CSP `frame-src`/`img-src` change and a CLS-reserved slot).
- **Two approved advertisers, narrow fit.** brkox (hobby/LED lighting) and
  Shenzhen Cangyu (electronics/accessories) cover only a slice of the 210 Setup
  topics. The topic map is deliberately sparse: 5 of 13 topics map to a merchant.
- **Amazon is still the breadth layer.** 195 Setup articles link Amazon;
  replacing those with two Awin merchants would remove most of the coverage.
- **CSP `connect-src` for `awin1.com`** is only needed by Convert-a-Link's
  reporting pings; if Convert-a-Link is turned off, drop it from
  `AWIN_CSP_SOURCES`.
