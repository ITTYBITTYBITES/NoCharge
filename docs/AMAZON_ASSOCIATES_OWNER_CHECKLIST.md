# Amazon Associates owner checklist

Complete this review manually before launch and periodically afterward. Do not record credentials, API keys, payment data, private account IDs, or other private Amazon account information here.

- [ ] Confirm `nocharge.net` is listed as an approved website in Amazon Associates.
- [ ] Confirm the public Associate tag is `nocharge-20`.
- [ ] Confirm the account is active and applicable to Amazon.com.
- [ ] Confirm the exact required statement, “As an Amazon Associate I earn from qualifying purchases.”, appears.
- [ ] Confirm page-level disclosure appears before every article's first affiliate link.
- [ ] Confirm every affiliate URL includes `tag=nocharge-20`.
- [ ] Confirm links are direct and are not shortened, redirected, or cloaked.
- [ ] Confirm no one tests links by clicking them automatically.
- [ ] Confirm there are no self-purchases or encouraged family/friend purchases through the links.
- [ ] Confirm no Amazon prices, reviews, ratings, descriptions, or images were manually copied.
- [ ] Confirm NoCharge does not imply Amazon sponsorship or endorsement.
- [ ] Confirm product and search links are periodically checked manually without automated Amazon requests.
- [ ] Confirm the owner reviews the current Amazon Operating Agreement and applicable policies.

## New-tab fix (2026-08-22)

**Change:** All affiliate links (existing 8 PR #20 articles + 10 new PR #26 articles) now open in a new tab with `target="_blank"` and `rel="sponsored nofollow noopener noreferrer"`. A visible "(opens in a new tab)" text cue follows every affiliate link.

**Rationale:** Opening an affiliate link in the same tab takes people away from a NoCharge game with no clear back path. The new-tab behavior preserves the player's game state and position. The `rel` attributes serve:
- `sponsored`: Amazon Associates compliance
- `nofollow`: transparency about affiliate intent
- `noopener`: security (prevents `window.opener` exploitation)
- `noreferrer`: strips Referer header (privacy benefit)

**Implementation:** Updated `PaidAmazonLink.astro` component (applies to all 18 articles). Added "Affiliate links open in a new tab so you don't lose your place on NoCharge." to the disclosure panel.

## Search-page vs product-page link policy (2026-08-22)

Amazon Associates pays commissions on both search-page and product-page referrals. Both link types are valid and continue to work.

**Search-page URLs** (`/s?k=...`): Used for "show me options in this category." Anchor text describes the category clearly (e.g., "shop trackball mice on Amazon"). Not a specific product recommendation.

**Product-page URLs** (`/dp/B0XXXXX`): Used for "this exact item is what we recommend." Anchor text names the specific item (e.g., "Logitech ERGO M575 trackball").

Both types require `tag=nocharge-20` in the query string. Future maintainers: Amazon's terms permit both search and product referrals; neither is deprecated.
