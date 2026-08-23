# PR #26 audit bug list

Audited August 23, 2026 against the merge commit `3f6001d`.

| Severity | Reproduction | Finding | Status |
| --- | --- | --- | --- |
| High | Solve a Nonogram, then press an arrow key or show/hide clue text. | Every render after solving incremented the persisted “puzzles revealed” total. | Fixed: completion is recorded once per puzzle. |
| High | Tab to a Tile Garden cell and press Enter or Space. | Cells listened only for `pointerdown`; native keyboard button activation never placed a tile. | Fixed: cells use native `click`; the regression test uses Enter. |
| High | Tab to a Nonogram cell and activate it with Enter or Space. | Cells likewise listened only for `pointerdown`; keyboard activation did not toggle the cell. | Fixed: cells use native `click`. |
| Medium | Use arrow keys in Tile Garden or Nonogram after focusing a cell. | Re-rendering the board discarded focus, so continued keyboard navigation was unreliable. | Fixed: focus follows the keyboard cursor after a board redraw. |
| Medium | Read the three Color Flip articles after opening the current visual mode. | Articles described a moving canvas, checkpoints, timing, and direct in-run color changes that no longer exist. | Fixed: the articles now describe the 5×5 pick-then-step board and preserve the turn-based Cycle color flow. |
| Medium | Run the Quiet Setup validators after a production build. | Validators still asserted the pre-PR count of 8 articles / 9 sitemap URLs / 8 feed items, so the shipped 18-item collection could not be validated. | Fixed: validators assert 18 articles, 19 setup sitemap URLs, and 18 feed items. |
| Low | Browse the 10 new Quiet Setup cards. | All ten used the `hero` artwork, making the listing visually repetitive despite existing matching artwork assets. | Fixed: cards now use available built artwork appropriate to their topics. |
| Low | Compare Privacy’s local-data description with new game storage. | The page omitted the new games’ locally stored progress and preferences. | Fixed: Privacy now names those categories. |

No change was made to Color Flip’s turn-based Cycle color → Step forward flow, its score behavior, or its focus-on-Play-again behavior.
