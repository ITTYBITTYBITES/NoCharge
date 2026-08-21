# Quiet Setup editorial policy

## Purpose and architecture

Quiet Setup is NoCharge's first-party practical editorial section at `/setup/`. It is visually related to the Quiet Arcade but structurally separate from gameplay. A dedicated Astro `setup` content collection avoids a false game association. The index is chronological and holds topic groupings until enough independently useful content exists for category routes. There are no category, tag, search, product, or generated ASIN routes.

The section covers keyboards, pointing devices, screens and stands, low-noise desk and comfort choices, and offline puzzles. It does not function as a store, deal feed, product database, medical resource, or professional ergonomic service. An article must remain useful if every affiliate link is removed. Commercial incentives never determine game content, scores, progression, or access.

## Evidence levels

- `editorial-research`: comparison of documented category characteristics and directly observable design criteria; no personal-use or hands-on claim.
- `personally-used`: owner-supplied evidence that a named item was used, with scope and dates recorded before publication.
- `hands-on-tested`: a documented, repeatable evaluation of a named item. The method and limitations must be stated.

Research, personal use, and hands-on testing are not interchangeable. All launch content is `editorial-research`. Never imply laboratory measurement, professional expertise, universal accessibility, guaranteed comfort or compatibility, or health, cognitive, learning, memory, vision, productivity, or ergonomic benefits.

## Selection and limitations

Define the reader's task and selection criteria before linking outward. Address tradeoffs, no-purchase paths, alternatives, what was and was not evaluated, compatibility variables, and a clear next action. Avoid unsupported superlatives. Do not publish current price, discount, stock, availability, Prime status, merchant rating, customer review, or review excerpt claims.

## Affiliate disclosure and paid links

An affiliate article renders the page-level disclosure before its first paid link and includes exactly: **As an Amazon Associate I earn from qualifying purchases.** Each paid link identifies Amazon and `(paid link)`, uses `rel="sponsored nofollow"`, works without JavaScript, and normally opens in the same tab.

The public Associate tag is centralized as `nocharge-20`. Links must be manually authored HTTPS links directly to `amazon.com` or `www.amazon.com`, with that exact tag. No redirect, cloaking, shortener, automatic tag injection, automated click, script, widget, iframe, API, merchant image, logo, or copied Amazon Program Content is permitted. Broad search links are preferred until an owner-approved and adequately evaluated ASIN exists.

## Review and retirement

Review evergreen copy and evidence scope at least every six months. Manually check paid destinations monthly and after reports; automation may inspect local markup but must not request Amazon or click links. A broken link is removed or replaced with another direct, accurately scoped link after manual review. If a recommendation becomes stale, preserve the useful article, remove the paid link, update `hasAffiliateLinks`, disclosure metadata, and reviewed date after actual review. Never conceal retirement with a deceptive NoCharge redirect.

Record material reviews in `CONTENT_ACCURACY_MATRIX.md`. Recheck the current Amazon Operating Agreement and disclosure requirements through the owner checklist. Merchant changes do not silently change NoCharge's evidence level.

## Artwork and separation

Quiet Setup uses original editorial illustrations, never Amazon imagery or fake gameplay screenshots. Paid links never enter game boards, controls, results, cards, instructions, Recently Played, pause UI, or ad containers. Setup routes set `showAds={false}`; this means no display-ad unit, not that compensated links are absent.
