# Social media owner checklist

This document is an owner-only guide. **No accounts are registered by the
repository or by automation**, and no profile links appear on the site until
the owner verifies them.

Last reviewed: 2026-08-21.

## 1. Handle selection

Check availability manually on each platform before registering anything.
Suggested candidates to check:

```text
@NoChargeGames
@NoChargeNet
@PlayNoCharge
```

Do not state that any handle is available unless you have verified it. The
site must not link to a profile that does not exist.

## 2. Initial platform recommendation

Start with **no more than two** platforms:

1. **Bluesky** — simple, low-noise, good for short factual updates and game
   captures.
2. **Mastodon** — durable, no algorithmic pressure, fits the Quiet Arcade
   voice.

**YouTube later if sustainable** — only when there is a real, maintained
reason to publish video (actual gameplay captures, not trailers for nothing).
Avoid opening many accounts that will be abandoned: each dormant profile
undermines the "small and quiet" positioning.

## 3. Profile setup

- **Display name:** `NoCharge` (not "No Charge", not "NoCharge Games" unless
  the handle requires it).
- **Bio:** use the short biography from `docs/BRAND_GUIDE.md`:
  "NoCharge publishes small browser games with clear guides — no account
  required, scores saved only in this browser."
- **Website URL:** `https://nocharge.net/` (or the media page if the platform
  needs a contact page: `https://nocharge.net/media/`).
- **Avatar:** `/public/social/nocharge-avatar-512.png`.
- **Header/social image where applicable:** `/public/social/nocharge-default.jpg`
  (1200×630) or a locked-down brand lockup from `/public/brand/`.
- **Contact method:** `hello@nocharge.net` where the platform asks.
- **Alt text:** every posted image needs alt text; add it even where optional.
- **Two-factor authentication:** enable MFA on the account and on the email
  used to register it.
- **Recovery codes:** store them securely outside this repository. Never
  document passwords or recovery codes in the repo, in issues, or in chat.

## 4. Posting principles

- **Low frequency:** a handful of real posts, not a content treadmill.
- **Real updates:** new games, guides, article launches, and verified platform
  changes — nothing fabricated.
- **No fabricated engagement:** do not buy followers, join engagement pods, or
  automate likes/reposts.
- **No automated spam:** no scheduling bots or keyword churn.
- **No affiliate-only stream:** Quiet Setup paid-link content must be a small
  part of a mostly independent stream, and paid links must be disclosed in the
  post (e.g., "affiliate link").
- **Use actual gameplay captures** for game posts; never present concept art
  or generated previews as gameplay.
- **Caption videos** and add alt text to every image.

## 5. Owner-only actions

- Register accounts and accept platform terms.
- Choose and verify handles.
- Enable MFA and protect recovery codes.
- Publish posts.
- Monitor replies and handle moderation.
- Verify profiles (and update the site only after verification).

## 6. Repository rule

The site ships **no** `twitter:site` handle, no social-profile links, and no
social embeds or share widgets. Adding any of them requires a verified profile
first, and the change should be a deliberate, reviewed PR.
