# I18N Audit — NoCharge

**Scope:** Phase 1 only (audit). No application code was changed.
**Branch:** `arena/7be0d20f-nocharge` (from `main` @ `e66d9b2`)
**Target languages:** English (`en`, default), Turkish (`tr`), French (`fr`)
**Method:** Static inspection of `src/`, `public/`, `tests/`, `docs/`, plus pattern scans (counts below are from grep/heuristic scans and are approximate, not exhaustive proofs).

---

## 0. Executive summary

NoCharge is a **static Astro 7.2.2 site** (`output: 'static'`) with 49 `.astro` page templates, 26 browser games written in vanilla TypeScript (canvas + DOM), and roughly **215,000 words** of English editorial content in Astro content collections. There is **no i18n framework, no locale folders, no `hreflang`, and `<html lang="en">` is hardcoded** in two places.

The architecture is a good fit for i18n: components are small, the site is static (so translated HTML can be pre-rendered and indexed), and there are no CSS `content:` text strings that carry meaning. The difficulty is almost entirely **volume and game-logic coupling**, not the framework.

Recommendation in one line: **URL-prefixed locales (`/tr/`, `/fr/`) using Astro's built-in i18n routing, a small in-house dictionary module (no third-party runtime library), and a phased scope: site chrome and games first, editorial content only after an explicit translation-review decision.**

---

## 1. Technical Feasibility Score

| Area | Score (1–10) | Rationale |
| --- | --- | --- |
| Shell & navigation (Header, Footer, BaseLayout, ModeToggle, consent UI) | **8** | Small, component-based; few strings; no framework lock-in. |
| Static pages (49 `.astro` pages) | **7** | Mostly literal text in templates; a few dynamic labels. |
| Game UI (26 games + shared shell) | **5** | Imperative DOM; ~118 `innerHTML` sites across ~30 files; English strings returned from engine logic; word games tied to ASCII alphabets. |
| Editorial content (~215k words, 343 content files) | **3** | Enormous translation/review load; quality, accuracy, and AdSense thin-content concerns; legal copy pending owner review. |
| SEO / routing | **7** | Static output makes locale subpaths straightforward; needs sitemap, `hreflang`, feeds, and `llms.txt` work. |
| Layout / CSS tolerance | **7** | Few fixed-size text containers; the mobile nav is the main pressure point. |
| Test suite impact | **6** | 41 Playwright specs with ~368 English role/text locators; they remain valid only if English stays the default and tests pin locale. |

**Overall feasibility: 6 / 10** for the full scope as requested.
- **Realistic 8 / 10** for UI chrome + game UI (Phase 2 scope as a first release).
- **3 / 10** if the goal includes translating all long-form editorial content in the same pass.

---

## 2. Architecture assessment

| Question | Finding | Evidence |
| --- | --- | --- |
| Stack | Astro 7.2.2, static output, TypeScript strict, vanilla games (Canvas + DOM), Vitest unit tests, Playwright e2e | `package.json`, `astro.config.ts` (`output: 'static'`) |
| Existing i18n framework | **None.** No `i18n` block in `astro.config.ts`, no `locales/`, no `lang/`, no `t()`-style helper | repo-wide search |
| Hardcoded document language | `lang="en"` on `<html>` in `BaseLayout.astro:125` and in `src/pages/embed/sound-engine.astro:10` | grep |
| Hreflang / alternate languages | **None.** `SeoHead.astro` emits only the RSS `alternate` link | grep for `hreflang`/`alternate` |
| Sitemaps / feeds / AI text | `sitemap.xml.ts`, `sitemap-setup.xml.ts`, `feed.xml.ts`, `setup/feed.xml.ts`, `llms.txt.ts`, `llms-full.txt.ts`, `search-index.json.ts` are all English-only and hardcode `<language>en-us</language>` in the setup feed | file review |
| Existing preference storage | 63 files use `localStorage`; `prefKey()` in `src/games/shared/storage.ts` namespaces keys as `nocharge:pref:*`, and `src/lab/mode/mode-toggle.ts` is a working precedent for a stored visitor preference | grep / file review |
| Dependency budget | Repo enforces asset budgets (`budget.json`, `check:assets`) and Lighthouse; new runtime code should stay tiny | `package.json` scripts |

**Verdict:** The stored-preference pattern (`mode-toggle.ts`) and the static build are both reusable. A new language preference fits cleanly.

---

## 3. Key blockers and breaking risks

Severity: **B** = blocker for the stated goal, **H** = high (needs design work), **M** = medium (routine work with care), **L** = low.

### 3.1 Game engines return English text from logic code — **B**
At least 30 `return` / `announcement:` sites in `src/games/*/engine.ts` produce user-facing English (for example `beacon-lattice/engine.ts:93` `Focused row ${y+1}, column ${x+1}.`, `checkers/engine.ts:192` `Row ${row}, Column ${col}`, `dots-and-boxes/engine.ts:138` `horizontal line, dot row …`). Engines are pure functions used in unit tests, so text has to move to a **key + params** return shape, with formatting done in `main.ts`. This is a refactor, not just extraction.

### 3.2 Inline HTML built with `innerHTML` — **B/H**
- **118** `innerHTML` / `insertAdjacentHTML` / `set:html` matches, across **30** non-test files (games, `HandoffScreen`, `SeoHead`, `BaseLayout`, `tools/nonogram-clue-calculator`, `tools/storage-inspector`).
- Translated strings containing markup (`<strong>`, `<em>`) would be injected as HTML. Rule for Phase 2: **plain text keys use `textContent`**; only keys explicitly marked as HTML (`*_html`) may use `innerHTML`, and they must be sourced from our own JSON only (never from user input or from storage).

### 3.3 String concatenation and plurals — **H**
Examples found (exact file:line from scan):
- `color-flip/main.ts:379` `Score ${state.score}. Best ${best}.` — word order and label style differ per language.
- `freecell/main.ts:502` `Completed in ${state.moves} moves.` — English-only plural; "1 moves" in English, and French/Turkish have different plural and suffix rules.
- `freecell/main.ts:457`, `klondike/main.ts:384` `${column.length} cards` and `top: ${cardName(...)}` — concatenated fragments inside `aria-label`s.
- `hangman/main.ts:118` `Wrong guesses: ${n} of ${MAX}${…}` — composite label with nested ternary.
- `color-flip/main.ts:245` `Current color X. Next tile Y.` — two entities, grammatical gender in French.
- `dots-and-boxes/main.ts:180` `Final boxes ${p1}–${p2}. Most boxes wins.`

Turkish is agglutinative: colors and object names need case suffixes (for example `Kırmızı` → `kırmızıyı`). Any sentence that inserts a **noun** into a template will need a **whole-sentence** key per locale, not a shared template.

### 3.4 Locale-sensitive text transforms and sorting — **M**
- `text-transform: uppercase` appears in 27 CSS files. Turkish needs `lang="tr"` on the element for correct `i`/`İ` casing; this works only if `<html lang>` is correct, so the `lang` fix is a prerequisite.
- `.toUpperCase()` / `.toLowerCase()` appears in 35 non-test sites. In user-visible paths, use `toLocaleUpperCase(locale)`.
- `localeCompare()` is used for sorting (about 25 sites). Without an explicit locale it uses the browser locale; for consistent results pass the active locale.
- **Dates:** 7 hardcoded `'en-US'` / `'en'` formatters (`ArticleCard.astro:15`, `SetupArticleCard.astro:21`, `articles/[slug].astro:26`, `changelog.astro:35`, `setup/[slug].astro:22`, `guides/[slug].astro:36`, `daily.astro:176`). These must read the active locale.

### 3.5 Word games depend on ASCII alphabets — **B for word games**
- `hangman/engine.ts` `canGuess()` accepts only `/^[A-Z]$/`.
- `word-loom/main.ts:218` filters input with `/[^A-Z]/g`.
- `word-tile-rush` and its engine use `/[a-z]+/g` for word tokens.
- Word-game **word lists are English**. Translating the words means a different alphabet (French `É`, `È`, `Ç`; Turkish `Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`, dotless `ı`) and different word validity. This is a **product decision** (see §7), not a translation task.

### 3.6 Text baked into images and SVG — **M**
- **18 SVG files contain `<text>` nodes**, including instructional diagrams with English labels such as `01 · CHOOSE / Select`, `02 · CONNECT / Build`, `03 · CONFIRM / Continue` (`public/game-art/color-flip/controls-diagram.svg`) and `01 · READ / Observe`, `02 · DECIDE / Choose`, `03 · RESULT / Resolve` (`word-tile-rush/scoring-diagram.svg`). These need per-locale SVG variants or conversion to HTML/CSS overlays.
- The `NoCharge` wordmark in `brand/nocharge-lockup-*.svg` is a brand name and should stay as is.
- Game icon SVGs contain single glyphs (for example `A`); these are card ranks or symbols, not translatable copy.
- Raster artwork (cover, pin, social-card JPG/WEBP): one sample (`game-art/checkers/social-card.jpg`) has **no baked-in text**. The other raster art was **not** inspected, so this must be confirmed before Phase 2 (see §6).
- **`alt` text** for images is English in `.astro` props and in `content.config.ts` (`artwork.alt`), so it needs keys or localized frontmatter too.

### 3.7 CSS `content:` pseudo-elements — **L**
Pseudo-elements are icons or symbols (`⏸ ▶ 🔊 🔇 ⚙ ⤡ ↻` in `GameShell.astro:433–447`, `+`/`−` in `FaqList.astro`, `×` in nonogram, `K` in checkers). They contain no translatable words. Immersive-mode toolbar buttons do not have visible text, so their accessible name must come from `aria-label` keys.

### 3.8 Layout and overflow — **M**
- **Mobile nav** (`global.css` ≤ 48rem): `.primary-nav` switches to `flex-wrap: nowrap`, `.nav-link` drops to `font-size: 0.82rem`, and there are **8 links plus a mode toggle** in one row (search link is hidden at narrow widths). This is the most likely place for French or Turkish labels to clip or push the layout. Fix with wrapping rules and a measured test at 320px.
- `.ad-banner__slot { overflow: hidden }` is ad-related and not text; leave it alone.
- Game toolbars use `.btn` with `min-height` but no `max-width`, so growth is fine; the risk is the label text inside narrow pill buttons (`Sound on` / `Sound off`, `Pause game` / `Resume game`).
- 10 `white-space: nowrap` / `text-overflow` rules and 62 `grid-template-columns: repeat(...)` / `flex-wrap: nowrap` usages should be reviewed during Phase 2 at ~30% text expansion.
- **No RTL language is planned.** Still, `dir` should come from the locale config so Arabic can be added later without refactoring.

### 3.9 Third-party text — **H (not translatable by us)**
- **Google Funding Choices** consent message and **AdSense** ad creative are rendered by Google. Their language follows Google's own settings and is **outside our JSON**. Our own `ConsentManager.astro` copy and the footer's "Analytics choices" / "Privacy and cookie settings" buttons are translatable.
- Analytics and ad consent wording is legal-adjacent (`docs/LEGAL_REVIEW.md` has all review items **unchecked**).

### 3.10 Legal and policy copy — **H**
`/terms/`, `/privacy/`, `/privacy-policy/`, `/advertising/`, `/accessibility/` and `/about/` contain policy wording. `docs/LEGAL_REVIEW.md` says counsel review is still pending. **Translating legal text without qualified review creates a new risk.** Recommendation: keep legal pages English-only (with a visible language notice and `lang="en"` on the page) until the owner approves translations.

### 3.11 Editorial content volume and quality — **B for full-scope**

| Collection | Files | Approx. words | Notes |
| --- | ---: | ---: | --- |
| `setup` | 210 | ~144,800 | Largest; Quiet Setup guides; schema has `publishedDate`, `reviewedDate`, topic |
| `articles` | 47 | ~24,900 | Game + platform articles; discriminated-union schema |
| `collections` | 11 | ~9,300 | Reviewed curated groupings |
| `games` | 26 | ~16,200 | Frontmatter: title, tagline, description, controls, alt text |
| `guides` | 26 | ~13,700 | One per game; `readTime`, `updated` |
| `learn` | 8 | ~3,900 | |
| `changelog` | 13 | ~1,400 | |
| `lab` | 2 | ~900 | Lab section (see §7) |
| **Total** | **343** | **~215,000** | |

Risks: translation accuracy for game rules and accessibility claims (`docs/CONTENT_ACCURACY_MATRIX.md`, `docs/EDITORIAL_STANDARDS.md`); thin or machine-generated duplicate content (`ADSENSE_THIN_CONTENT_AUDIT.md` already flags thin content); and the cost of keeping 3 copies in sync on every edit.

### 3.12 Routing and generated outputs — **M**
Locale subpaths multiply the static output: every page and content entry is built once per locale. Build time and output size grow roughly linearly. Keep the **asset budget** (`check:assets`) and **HTML validation** (`validate:html`) in the loop. `verify:build` also checks the sitemap, feeds, FAQ schema, and structured data, all of which become locale-aware.

### 3.13 Test suite — **M**
- 41 Playwright specs contain about **368** `getByRole` / `getByText` / `getByLabel` / `toHaveText` lines matching English names. Keep English as the default and pin `en` in the test config; add a locale-matrix job later.
- `scripts/audit-content-quality.mjs` and `scripts/validate-game-tool-content.mjs` were **not** reviewed for language-specific rules, so they need a check before content translation begins.

### 3.14 Lab section — **L/M (decision)**
`src/lab/` is an experimental section (prototype pages, plus a hardcoded `confirm()` string in `barn-road-chronicles/main.ts:253`). Excluding it from the first release keeps scope tight.

### 3.15 Privacy and storage — **M**
A new `language` preference is a small localStorage key. It must:
- be registered in the storage documentation used by the storage inspector (`src/lib/storage-docs.ts`, not yet read in detail);
- be handled by the privacy "clear my data" flows (see `tests/e2e/privacy-clear-data.spec.ts`); and
- not add any analytics or tracking.

### 3.16 Positive findings (not blockers)
- Single layout (`BaseLayout.astro`) and shared `Header`/`Footer` mean the chrome can be localized in one place.
- Games are lazy-loaded per game (`games/registry.ts`), so a per-locale dictionary can load only with its game.
- No CSS `content:` text carries meaning; icons are symbols.
- `textContent` is used 337 times, which is the safe pattern for translated text.
- Game state is local-only (`localStorage`); language switching does not need server work.

---

## 4. Complete list of files containing hardcoded text

Method: heuristic scan of all non-test `.astro`, `.ts`, `.js`, `.tsx`, and `.md` files under `src/`.
- *Template text* = visible text nodes in `.astro` markup (outside `<script>`/`<style>`).
- *Attr* = `aria-label`, `title`, `alt`, `placeholder` literal values in `.astro`.
- *Script strings* = English-looking string literals in `.ts`/`.js`/inline script code (includes some dev/error messages and false positives; treat as a review list, not a final count).

Totals from the scan: **128 files** with candidate text (of 558 scanned). Template text nodes ≈ **1,387**; attribute literals ≈ **111**; script-string candidates ≈ **1,539**. Files without translatable copy (pure logic, data, tests, styles) are excluded from this list.

The full per-file table is generated in the appendix (§9).

**Hot spots by priority (Phase 2 order):**
1. `src/components/` shell: `Header`, `Footer`, `GameShell`, `ConsentManager`, `ModeToggle`, `ToolPage`, `GameCard`, `GuideCard`, `ArticleCard`, `RecentlyPlayed`, `Breadcrumbs`, `AdSenseBanner`, `HandoffScreen`, `SeoHead`.
2. `src/layouts/BaseLayout.astro`, `src/pages/*.astro` (49 pages), `src/pages/tools/*` (17 pages).
3. `src/games/shared/shell.ts`, `src/games/shared/pass-play.ts`, and the 26 `src/games/*/main.ts` files.
4. `src/games/*/engine.ts` (announcement and label strings returned by pure logic).
5. `src/content/*` (long-form; separate decision, see §7).

---

## 5. Live regions and accessibility text

`aria-live` / announcement helpers appear in **86** files. Screen-reader announcements are the most important text to translate correctly, because visitors who rely on them often cannot see the rest of the page. Each `announce()` call is a translation key and must be covered by the same fallback and test rules as visible text.

---

## 6. Open verification items (before Phase 2)

1. Inspect the remaining raster artwork (covers, pins, guide headers) for baked-in text. One sample was clean.
2. Confirm the Astro 7 i18n routing API (`i18n` config, `getRelativeLocaleUrl`, `getLocaleByPath`) against the installed version; verify with a build of a two-page prototype.
3. Read `src/lib/storage-docs.ts`, `scripts/audit-content-quality.mjs`, and `scripts/validate-game-tool-content.mjs` for any English-only assumptions.
4. Confirm whether Google's Funding Choices message language can be influenced from the page (`hl` / locale settings); otherwise document it as Google-controlled.
5. Run the existing baseline (`npm ci`, `npm run check`, `npm run build`, `npm run verify:build`) on `main` to record a green baseline. **Not yet run in Phase 1.**

---

## 7. Decisions needed from the owner

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| D1 | URL strategy | (a) Client-side only (`localStorage`, no URL change); (b) URL prefixes `/tr/`, `/fr/` with English at root | **(b)** — indexable, correct `lang`, `hreflang`, and works without JavaScript |
| D2 | Phase 2 scope | (a) Chrome + pages + games; (b) also editorial content; (c) chrome only | **(a)**. Content as a separate, later phase |
| D3 | Word games | (a) Keep English word lists, UI translated; (b) per-locale word lists and alphabets; (c) exclude word games in TR/FR | **(a)** for launch, with a note in the UI |
| D4 | Legal pages | (a) English-only with notice; (b) translate after counsel review | **(a)** |
| D5 | Lab section | (a) Excluded; (b) included | **(a)** |
| D6 | Translation quality | (a) Machine draft + native review; (b) professional translator; (c) owner-written | Needs owner decision and budget |

---

## 8. Recommended implementation strategy

### 8.1 Framework
- **Routing:** Astro's built-in i18n routing with `defaultLocale: 'en'`, `locales: ['en', 'tr', 'fr']`, and `routing.prefixDefaultLocale: false`, so English stays at `/`, `/arcade/`, and so on, and Turkish and French live under `/tr/` and `/fr/`. (Verify the exact API against Astro 7.2.2 in Phase 2.)
- **Dictionary:** a small in-house module, not i18next or another runtime library. Reasons: zero new dependencies, a tiny browser payload (the repo enforces asset budgets), and build-time resolution for static templates. Use `Intl.PluralRules`, `Intl.NumberFormat`, and `Intl.DateTimeFormat` for formatting.
- **Client-side switching:** a language switcher that navigates to the equivalent localized URL (a full navigation, but instant with the same content). Optional later enhancement: Astro view transitions.
- **Detection:** on first visit to an English URL with no stored preference, read `navigator.languages`. If it matches `tr` or `fr`, show a one-time, dismissible suggestion or redirect from the root only. **Do not** redirect crawlers or force redirects on deep links. Persist the choice in `localStorage` with `prefKey('language')` (`nocharge:pref:language`).
- **Fallback:** a missing key falls back to English at build time (merge `en` under each locale) and at runtime (`t()` checks locale, then `en`, then reports to the console in dev only). Missing keys must not render raw key names in production.

### 8.2 Proposed folder structure
```text
locales/
  en.json            # base; every key lives here
  tr.json
  fr.json
src/i18n/
  config.ts          # locales, default, labels, dir (ltr), BCP-47 tags
  index.ts           # t(key, params), resolveLocale(), fallback chain
  format.ts          # date/number/plural helpers using Intl and the active locale
  client.ts          # detection, localStorage preference, switcher controller
  routes.ts          # localized URL helpers (wraps Astro's helpers)
src/components/LanguageSwitcher.astro
tests/e2e/i18n.spec.ts
src/i18n/*.test.ts   # vitest: key parity, placeholder parity, fallback
```
Content (`src/content/...`) stays English-only in Phase 2. A later phase can add `src/content/<collection>/<locale>/...` or a locale-aware loader.

### 8.3 Translation key naming convention
- Format: `area.component.element`, lowercase dot-separated segments in camelCase where needed.
  - `nav.arcade`, `nav.search`, `footer.copyright`, `consent.analyticsOff`
  - `game.toolbar.pause`, `game.toolbar.soundOn`, `game.paused.resume`
  - `games.checkers.title`, `games.checkers.controls.move`
  - `a11y.announce.gamePaused` (screen-reader text)
  - `status.colorScore` (whole sentence, not fragments)
- **Never concatenate** translated fragments. Use one sentence per key with named placeholders: `"score.summary": "Score {score}. Best {best}."`
- **Plurals** use `_one` / `_other` (and `_few` / `_many` where the locale needs them, resolved by `Intl.PluralRules`): `"moves_one": "{count} move"`, `"moves_other": "{count} moves"`.
- **Rich text** only with the suffix `_html`, sourced from our JSON only; default to `textContent`.
- **Enums** (`colorName`, `pieceName`): map id → key (`colors.red`), never pass display names around in logic.
- `data-i18n="nav.arcade"` (text) and `data-i18n-attr="aria-label:game.toolbar.mute"` (attributes) for static HTML, mirroring the spec's example.

### 8.4 Phase 2 gates (for the next step, not done yet)
1. Engine refactor: `engine.ts` returns `{ key, params }` for announcements; `main.ts` formats them.
2. Pseudo-locale test (expanded text, ~30% longer) at 320px, 375px, and 1280px; no clipped nav or toolbar labels.
3. Key parity test: every `en` key exists in `tr` and `fr` (or is listed as an allowed gap); placeholder names match across locales.
4. E2E: switching language updates visible text and `aria-label`s without a manual reload; `<html lang>` and `dir` update; sorting and dates follow locale.
5. SEO: `hreflang` alternates, localized canonical, sitemap entries for translated URLs only, `<html lang>` set per page.
6. Existing English e2e suite stays green with English as default.

---

## 9. Appendix — per-file hardcoded-text scan (generated)

Generated from the scan on the `arena/7be0d20f-nocharge` branch. Counts are heuristic; use this as the Phase 2 work list and confirm each file while extracting.

| File | Template text | Attr literals | Script strings |
| --- | ---: | ---: | ---: |
| `src/components/AdSenseBanner.astro` | 1 | 1 | 1 |
| `src/components/ArticleCard.astro` | 0 | 1 | 0 |
| `src/components/Breadcrumbs.astro` | 0 | 1 | 0 |
| `src/components/ConsentManager.astro` | 17 | 1 | 7 |
| `src/components/Footer.astro` | 25 | 0 | 0 |
| `src/components/GameArtwork.astro` | 0 | 0 | 1 |
| `src/components/GameCard.astro` | 2 | 0 | 2 |
| `src/components/GameShell.astro` | 17 | 4 | 14 |
| `src/components/GuideCard.astro` | 1 | 0 | 0 |
| `src/components/Header.astro` | 9 | 3 | 2 |
| `src/components/ModeToggle.astro` | 2 | 1 | 2 |
| `src/components/RecentlyPlayed.astro` | 4 | 0 | 0 |
| `src/components/SeoHead.astro` | 0 | 0 | 7 |
| `src/components/setup/AffiliateDisclosure.astro` | 2 | 1 | 1 |
| `src/components/setup/EvidenceLabel.astro` | 0 | 0 | 2 |
| `src/components/setup/PaidAmazonLink.astro` | 4 | 0 | 2 |
| `src/components/setup/SetupArticleCard.astro` | 3 | 0 | 0 |
| `src/components/setup/SetupArtwork.astro` | 0 | 0 | 23 |
| `src/components/SoundEngine/SoundCanvas.js` | 0 | 0 | 2 |
| `src/components/SoundEngine/SoundEngine.js` | 0 | 0 | 14 |
| `src/components/ToolPage.astro` | 9 | 0 | 3 |
| `src/config/affiliate.ts` | 0 | 0 | 2 |
| `src/config/dailies.ts` | 0 | 0 | 7 |
| `src/config/tools.ts` | 0 | 0 | 52 |
| `src/content.config.ts` | 0 | 0 | 1 |
| `src/games/beacon-lattice/engine.ts` | 0 | 0 | 16 |
| `src/games/beacon-lattice/main.ts` | 0 | 0 | 10 |
| `src/games/beacon-lattice/patterns.ts` | 0 | 0 | 4 |
| `src/games/beacon-lattice/puzzles.ts` | 0 | 0 | 73 |
| `src/games/beacon-lattice/quality.ts` | 0 | 0 | 2 |
| `src/games/checkers/main.ts` | 0 | 0 | 4 |
| `src/games/color-flip/main.ts` | 0 | 0 | 21 |
| `src/games/dots-and-boxes/main.ts` | 0 | 0 | 4 |
| `src/games/four-in-a-row/main.ts` | 0 | 0 | 8 |
| `src/games/freecell/main.ts` | 0 | 0 | 17 |
| `src/games/gomoku/main.ts` | 0 | 0 | 3 |
| `src/games/hangman/engine.ts` | 0 | 0 | 2 |
| `src/games/hangman/main.ts` | 0 | 0 | 5 |
| `src/games/klondike/main.ts` | 0 | 0 | 17 |
| `src/games/last-token/main.ts` | 0 | 0 | 4 |
| `src/games/lights-out/main.ts` | 0 | 0 | 6 |
| `src/games/memory-match/main.ts` | 0 | 0 | 3 |
| `src/games/minesweeper/main.ts` | 0 | 0 | 12 |
| `src/games/mini-sudoku/main.ts` | 0 | 0 | 20 |
| `src/games/nine-mens-morris/main.ts` | 0 | 0 | 12 |
| `src/games/nonogram/main.ts` | 0 | 0 | 7 |
| `src/games/pass-the-picture/main.ts` | 0 | 0 | 8 |
| `src/games/registry.ts` | 0 | 0 | 2 |
| `src/games/reversi/main.ts` | 0 | 0 | 7 |
| `src/games/shared/audio/catalog.ts` | 0 | 0 | 50 |
| `src/games/shared/pass-play.ts` | 0 | 0 | 2 |
| `src/games/shared/pause-recovery.ts` | 0 | 0 | 4 |
| `src/games/shared/shell-menu.ts` | 0 | 0 | 8 |
| `src/games/shared/shell.ts` | 0 | 0 | 28 |
| `src/games/simon/main.ts` | 0 | 0 | 8 |
| `src/games/sudoku-9x9/main.ts` | 0 | 0 | 23 |
| `src/games/tic-tac-toe/main.ts` | 0 | 0 | 12 |
| `src/games/tile-garden/main.ts` | 0 | 0 | 3 |
| `src/games/twenty-forty-eight/main.ts` | 0 | 0 | 3 |
| `src/games/word-loom/main.ts` | 0 | 0 | 8 |
| `src/games/word-search/main.ts` | 0 | 0 | 11 |
| `src/games/word-tile-rush/main.ts` | 0 | 0 | 4 |
| `src/lab/ads/adslots.astro` | 2 | 0 | 0 |
| `src/lab/hud/lab-hud.ts` | 0 | 0 | 4 |
| `src/lab/prototypes/barn-road-chronicles/main.ts` | 0 | 0 | 68 |
| `src/lab/prototypes/pulse-runner/main.ts` | 0 | 0 | 1 |
| `src/lab/registry.ts` | 0 | 0 | 2 |
| `src/layouts/BaseLayout.astro` | 1 | 0 | 3 |
| `src/lib/brand-blurb.ts` | 0 | 0 | 1 |
| `src/lib/collection-validation.ts` | 0 | 0 | 6 |
| `src/lib/local-game-data.ts` | 0 | 0 | 2 |
| `src/lib/my-arcade/mount.ts` | 0 | 0 | 2 |
| `src/lib/my-arcade/summary.ts` | 0 | 0 | 31 |
| `src/lib/setup-topics.ts` | 0 | 0 | 11 |
| `src/lib/storage-docs.ts` | 0 | 0 | 64 |
| `src/pages/404.astro` | 6 | 2 | 4 |
| `src/pages/about.astro` | 33 | 1 | 2 |
| `src/pages/accessibility.astro` | 76 | 2 | 5 |
| `src/pages/advertising.astro` | 30 | 1 | 4 |
| `src/pages/arcade.astro` | 56 | 7 | 16 |
| `src/pages/articles/[slug].astro` | 13 | 1 | 19 |
| `src/pages/articles/index.astro` | 17 | 1 | 10 |
| `src/pages/articles/registry-facts.astro` | 50 | 1 | 32 |
| `src/pages/changelog.astro` | 11 | 2 | 8 |
| `src/pages/collections/[slug].astro` | 5 | 0 | 2 |
| `src/pages/collections/index.astro` | 4 | 2 | 3 |
| `src/pages/contact.astro` | 13 | 1 | 9 |
| `src/pages/daily.astro` | 38 | 1 | 16 |
| `src/pages/embed/sound-engine.astro` | 1 | 0 | 0 |
| `src/pages/games/[slug].astro` | 11 | 0 | 8 |
| `src/pages/guides/[slug].astro` | 10 | 0 | 15 |
| `src/pages/guides/index.astro` | 24 | 1 | 5 |
| `src/pages/help.astro` | 54 | 2 | 39 |
| `src/pages/index.astro` | 58 | 2 | 11 |
| `src/pages/lab/[slug].astro` | 11 | 2 | 5 |
| `src/pages/lab/index.astro` | 10 | 1 | 3 |
| `src/pages/learn/[slug].astro` | 4 | 0 | 2 |
| `src/pages/learn/glossary.astro` | 7 | 2 | 31 |
| `src/pages/learn/index.astro` | 16 | 2 | 8 |
| `src/pages/llms-full.txt.ts` | 0 | 0 | 8 |
| `src/pages/llms.txt.ts` | 0 | 0 | 2 |
| `src/pages/media.astro` | 59 | 3 | 31 |
| `src/pages/my-arcade.astro` | 56 | 1 | 17 |
| `src/pages/privacy-policy.astro` | 5 | 1 | 6 |
| `src/pages/privacy.astro` | 46 | 3 | 7 |
| `src/pages/search-index.json.ts` | 0 | 0 | 26 |
| `src/pages/search.astro` | 16 | 4 | 10 |
| `src/pages/setup/[slug].astro` | 7 | 1 | 17 |
| `src/pages/setup/index.astro` | 58 | 2 | 11 |
| `src/pages/terms.astro` | 26 | 1 | 4 |
| `src/pages/tools/ambient-mixer.astro` | 27 | 3 | 20 |
| `src/pages/tools/contrast-checker.astro` | 18 | 4 | 30 |
| `src/pages/tools/discovery-wheel.astro` | 59 | 2 | 17 |
| `src/pages/tools/focus-order-demo.astro` | 18 | 2 | 17 |
| `src/pages/tools/game-finder.astro` | 12 | 2 | 42 |
| `src/pages/tools/index.astro` | 14 | 2 | 14 |
| `src/pages/tools/nonogram-clue-calculator.astro` | 22 | 4 | 22 |
| `src/pages/tools/random-activity.astro` | 11 | 2 | 28 |
| `src/pages/tools/reduced-motion-tester.astro` | 21 | 2 | 21 |
| `src/pages/tools/session-planner.astro` | 21 | 5 | 20 |
| `src/pages/tools/singing-bowl-engine.astro` | 60 | 2 | 20 |
| `src/pages/tools/solitaire-comparator.astro` | 50 | 3 | 16 |
| `src/pages/tools/storage-inspector.astro` | 29 | 3 | 24 |
| `src/pages/tools/sudoku-helper.astro` | 15 | 3 | 22 |
| `src/pages/tools/touch-target-checker.astro` | 15 | 3 | 16 |
| `src/pages/tools/word-scoring.astro` | 22 | 4 | 21 |
| `src/pages/tools/zoom-visualizer.astro` | 43 | 2 | 20 |
| `src/utils/StateSerializer.js` | 0 | 0 | 2 |

**Total files listed:** 128
