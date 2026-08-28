# DECISIONS_NEEDED

Only true forks. Each entry states the options and the implemented default; none blocked the program.

## 1. Daily word naming
- **Decided:** "Word Loom" is live (original name, original rules, symbol+color feedback, calm word list).
- **Open question (no blocker):** whether the daily word should also appear as a distinct "challenge" URL (`/games/word-loom/?daily=1` is the current semantics). Current default: query param does not change behavior (daily is the default mode).
- **Not open:** using a third-party name or trade dress — prohibited by constraint 8.

## 2. Checkers capture rule
- **Decided:** English draughts, simple capture rule (any legal jump), mandatory captures, multi-jump continuation, no flying kings.
- **Open question:** if a tournament-grade variant is later desired (longest-chain enforcement), it would be a separate mode, not a silent change. Default implemented: simple rule, documented.

## 3. Chess / other classic board games
- **Status:** not yet built (remaining backlog). When built: Pass & Play first, no AI in v1, no Elo/ratings. No decision needed now.

## 4. Offline-after-load collection
- **Decided (wontfix):** no service worker exists. The collection is not published; the honest position is in `/learn/unblocked-vs-no-account/`.
- **Revisit only if:** a service worker/offline package is deliberately added with full cache and update strategy.

## 5. Daily timezone
- **Decided:** device-local date (`YYYY-MM-DD`) for Word Loom and the daily hub; documented in `/config/dailies.ts` and on `/daily/`.

## 6. Tools categories
- **Decided:** Play · Audio · Accessibility · Setup helpers · Learning (A5). Categories are descriptive, not a ranking.

## 7. Setup guides expansion
- **Decided:** cross-links added at the Setup hub (topic → tool → 3 games) rather than 7 new pillar pages, avoiding cannibalization of 210 existing guides. Pillar pages remain a future option if a specific hub consistently needs one.

## 8. AdSense / analytics
- No change: existing consent model preserved; no new ad slots; tools and game pages keep gameplay ad-free.
