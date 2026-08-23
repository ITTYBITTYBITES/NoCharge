# NoCharge editorial standards

These standards apply to public game, guide, article, collection, and changelog content. They are a working publishing checklist, not an automated approval system.

## Voice and tone

Write clearly, calmly, specifically, and directly. Keep pressure low. Remove filler and exaggerated marketing. There is no target word count: a page should be only as long as its subject requires. Never make unsupported “best,” health, cognitive, educational, or performance claims. Describe what NoCharge and its games actually do.

## Terminology

- **Game:** a published interactive title in the Arcade.
- **Run:** one continuous attempt from start or restart to completion or end. Beacon Lattice also uses **puzzle** for one board.
- **Puzzle:** a discrete logic problem; currently the term applies most directly to Beacon Lattice.
- **Move:** the action counted by a game’s rules. In Memory Match, one two-card attempt is one move. Do not substitute click, tap, or turn unless the runtime does.
- **Score:** the result calculated by current game code. **Best score** is the locally retained best result; Beacon Lattice retains best beacon counts and completion progress, while Memory Match also retains best moves.
- **Local storage:** browser storage on the current browser profile and device. Do not call it encrypted, secure, uploaded, or synchronized.
- **Pause:** suspension through the shared toolbar or lifecycle recovery. A hidden tab and an open platform dialog can pause timed activity.
- **Restart:** begin the current game or puzzle again through the shared New game/restart action.
- **Untimed mode:** a mode with no time requirement, such as Color Flip turn-based mode. Memory Match and Beacon Lattice are untimed games. Do not describe Word Tile Rush as untimed.
- **Reduced-pressure mode:** an alternative that meaningfully removes or reduces timing pressure; use only when the current controls support it.
- **Accessibility option:** a documented control, mode, preference, or design behavior that offers another usable path. Do not imply certification.
- **Advertisement:** the labeled, third-party Google AdSense placement outside gameplay.
- **Sponsored content:** paid editorial-format material. NoCharge has none. If introduced later, label it prominently and keep it separate from independent editorial content.

Game-specific terms must follow runtime labels: Word Tile Rush uses adjacent letter paths and valid words; Color Flip uses Visual and Turn-based modes plus Green, Blue, Amber, and Rose labels; Beacon Lattice uses Cross, Diagonal, Horizontal, Vertical, gap, exact, overlap, void, blocked, inventory, and beacon count.

## Content types

- **Game pages** state current rules, controls, modes, storage, typical session, and artwork alt text. Their runtime and registry are authoritative.
- **Definitive guides** cover the complete current control and rule set, scoring or completion logic, accessibility notes, and tested diagrams.
- **Supporting game articles** explain one real mechanic or strategy without duplicating the guide. They require a real related game.
- **Platform articles** explain NoCharge-wide policy, design, privacy, or testing. They use platform metadata and must not claim a fake related game.
- **Curated collections** require a stated, reviewable inclusion method and at least three qualifying current games. Every member needs a specific reason.
- **Changelog entries** record a material public change with an honest date and enough context to distinguish current behavior from history.

## Metadata standards

Every applicable entry has a unique, human-readable **title** and accurate **description**. Articles identify an **author**, **reviewer**, **published date**, honest **updated date**, estimated **read time**, and specific **topics**. Game articles identify a **related game**; platform articles identify a **platform category** instead. Use **draft** to prevent publication and **featured** only for deliberate promotion. Record a gameplay/version compatibility note when a rules change would otherwise make the review scope ambiguous. Game and guide records retain their existing ordering and relationship metadata.

Do not change an updated date for formatting-only edits. Dates use `YYYY-MM-DD` in content metadata.

## Publishing rules

Before publishing:

1. Verify controls, rules, mode names, scoring, storage, and lifecycle claims against current code and tests.
2. Use original examples; do not copy another publisher’s examples or phrasing.
3. Use actual mounted-game screenshots when gameplay is pictured. Never manufacture a game state and call it a screenshot.
4. Keep published and updated dates honest.
5. Link to relevant games, definitive guides, trust pages, or Arcade routes.
6. Do not create pages solely for keyword variations.
7. Clearly separate editorial content from advertising; advertisements do not influence inclusion or conclusions.
8. Review accessibility language for usable specifics, target-versus-certification wording, and unverified manual-test claims.
9. Review external claims and citations. Prefer primary sources; verify links and quote context.
10. Check mobile readability, one clear H1, logical heading order, descriptive links, and visible focus.

## Screenshot and artwork standards

Follow [`ART_ASSETS.md`](./ART_ASSETS.md), [`ART_DIRECTION.md`](./ART_DIRECTION.md), and game-specific capture documents for current dimensions, formats, budgets, capture provenance, and alt text. Those documents are authoritative; do not duplicate dimensions here and let them drift. Text needed to understand an article must remain HTML, not baked into an image.

## Review cadence

These are owner review recommendations; the repository does not automate all of them.

- Review game-dependent pages after any related gameplay, controls, scoring, storage, or lifecycle change.
- Review evergreen platform content every six months.
- Check outbound links monthly or through an explicitly configured automation.
- Review and recapture screenshots after relevant UI changes.
- Review advertising and privacy copy after any provider, tag, consent, storage, or policy change.

Record each completed review in the content accuracy matrix, a changelog entry, or a linked issue. Never mark a review complete based only on its due date.

## Public changelog and support

The public changelog is written for visitors: it names meaningful games, guides, controls, navigation, privacy, and presentation changes without commit mechanics, test counts, package versions, or deployment details. The Help page is practical support, not a keyword-targeted article; it must distinguish local game data from optional analytics consent and avoid response-time promises.

Platform article illustrations are editorial aids. Titles and surrounding copy carry the essential meaning, and illustrations must not be presented as gameplay screenshots or imply accounts, cloud sync, universal compatibility, certification, rewards, or ad-free operation.

## Quiet Setup and compensated links

Quiet Setup is governed by [`QUIET_SETUP_EDITORIAL_POLICY.md`](./QUIET_SETUP_EDITORIAL_POLICY.md). It uses a dedicated content model, honest evidence labels, no-purchase alternatives, visible disclosures, and direct manually authored paid links. Editorial usefulness comes before monetization. Paid relationships never affect game rules, scores, access, collections, or instructions, and affiliate links never appear in gameplay UI.

## Brand, media, and feeds

The brand identity, media page, media kit, and feeds are governed by
[`BRAND_GUIDE.md`](./BRAND_GUIDE.md) and the repository validators:

- Public descriptions use the approved one-line, short bio, medium
  description, or press boilerplate from the brand guide. Never claim
  ad-free, tracking-free, certified accessibility, rankings, player counts,
  revenue, or guarantees.
- My Arcade is a browser-local dashboard, never a "secure private account".
- The media page is the canonical facts source; counts are generated from the
  content collections, not hard-coded. It contains no affiliate links and no
  unverified contact addresses or social profiles.
- Gameplay screenshots in the media kit and on `/media/` must be genuine
  mounted-DOM captures. Generated previews are cover or illustration artwork,
  never screenshots.
- The general feed (`/feed.xml`) is derived from the changelog collection; it
  must never carry affiliate links, tracking pixels, or social URLs, and its
  GUIDs stay stable changelog anchors.
- No invented social handles may appear anywhere; account registration and
  verification are owner actions.

## Expanded coverage (PR #26, 2026-08-22)

The Quiet Arcade now includes 9 solo games (4 original + 5 new) and 6 pass-and-play games. Editorial coverage expanded to include:

- 5 new game guides (Klondike, FreeCell, Nonogram, Twenty Forty-Eight, Tile Garden)
- 6 new game articles (5 per-game + 1 cross-game announcement)
- 10 new Quiet Setup articles (displays, audio, posture, lighting, desk organization)
- Color Flip visual mode redesigned from reflex timing to calm tap-to-step

All new content follows existing editorial standards: general-audience wording, no AI claims, no optimal-strategy claims, no dark patterns. Quiet Setup articles maintain affiliate disclosure, new-tab behavior, and editorial-research evidence level.
