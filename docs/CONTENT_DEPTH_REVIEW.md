# Content-depth review

Reviewed 2026-08-19 against the current registry, content collections, runtime, and route templates. This is an editorial audit, not a word-count exercise.

| Route or group | Visitor purpose and unique value | Next action | Source of truth | Duplicate / improvement | Changed / deliberately not added |
|---|---|---|---|---|---|
| `/` | Entry point for games, Recently Played, guides, articles, and collections | Enter Arcade or choose a library path | Registry and content collections | Some explanatory copy repeated trust pages | Replaced ad-oriented sentence with library navigation; no hero illustration or filler |
| `/arcade/` | Compare four games by genre, session, controls, and guides | Open a game or guide | Registry, game pages, runtime | Distinct from collections because it is the full catalog | Existing editorial notes retained; no filters or tags |
| `/guides/` | Explain what complete guides contain and help choose one | Open a guide | Guide collection and runtime | Not a duplicate of article index | Index explains guide depth without copying instructions |
| `/articles/` | Separate platform explainers from game-specific notes | Read an article or guide | Article collection and article metadata | Distinct from guides: articles answer one focused question | Added visual distinction and editorial illustration family; no filters |
| `/collections/` | Explain four honest discovery lenses | Open a collection | Collection metadata and validation | Distinct from Arcade by inclusion method | Added clearer method framing; no taxonomy |
| Four collection routes | Explain inclusion and each member's reason, with game links | Play a member or read its guide | Collection metadata, registry, validation | Reuses game cards intentionally | No collection hero art: game cards provide sufficient identity |
| Four game routes | Explain type, timing, session, inputs, local result, guide, and related reading before play | Play, guide, or article | Registry, runtime, reviewed content | Not a guide replacement | Existing templates supply the facts; no duplicated full instructions |
| Four guide routes | Complete rules, controls, scoring, and strategies | Play the game | Runtime and guide markdown | More complete than supporting articles | Existing depth retained; no generic introductions |
| Game articles | One focused explanation tied to one game | Read guide or play | Runtime/tests and article metadata | Supporting notes intentionally narrower than guides | Existing focused articles retained |
| Platform articles | Explain Quiet Arcade, local scores, ways to play, and testing | Explore Arcade, Privacy, Accessibility, or Help | Layout, storage, runtime, CI docs | Not game guides | Added cohesive editorial artwork; no fake game CTA |
| `/about/` | Trust, ownership, contact, and product context | Read Privacy or play | Product implementation and policy pages | Some ad detail belongs on Advertising | Existing route kept; no promotional claims |
| `/privacy/`, `/terms/`, `/accessibility/`, `/advertising/` | Policy, consent, limitations, and reporting destinations | Make a choice or contact NoCharge | Runtime, consent, ad config, legal review | Purposefully separate | No illustrations added |
| `/help/` | Practical support for controls, local data, consent distinction, and troubleshooting | Return to game or email hello@nocharge.net | Game shell, storage, consent, reviewed docs | New route; no equivalent substantial support page existed | Added one support destination; no FAQ schema, chat, or response-time promise |
| `/my-arcade/` | Answers "what did I play here, what did this browser save, and how do I continue or clear it" in one calm place | Continue a game, open a guide, or clear local data | Game storage modules, Recently Played, `src/lib/my-arcade/` | Not a duplicate of Arcade: Arcade is the catalogue, My Arcade reads this browser | Added one local dashboard; no account, ranking, streak, or completion mechanic, and no advertisement or affiliate link |
| `/changelog/` | Concise visitor-facing history | Return to the relevant library area | Merged public releases and content history | Technical release logs removed from visible copy | Consolidated history into plain-language entries |

## Findings

- The four game pages, guides, and collection routes had clear distinct purposes and did not need route proliferation.
- The main missing support destination was a practical Help page; `/help/` now links controls, troubleshooting, local data, and consent without becoming an SEO article.
- Changelog entries previously mixed visitor changes with implementation details. Those details remain in Git history and engineering documents, while meaningful history remains visible in summarized form.
- Collections reuse canonical game cards and reasons rather than repeating generic paragraphs. No separate identity graphics were added because the cards already distinguish the four routes.
- Platform explainers now have clear visual and structural separation from game articles.

## Quiet Setup launch review (2026-08-21)

| Route or group | Visitor purpose and unique value | Next action | Deliberate boundary |
|---|---|---|---|
| `/setup/` | Chronological, evidence-labeled practical setup publication with visible topic groupings | Read a guide or subscribe to RSS | No empty topic, search, store, deal, or product routes |
| Eight setup articles | Independently useful comparisons covering method, input, keyboards, switches, stands, zoom, offline puzzles, and low-noise desks | Apply a no-purchase test, then optionally compare | All evidence is editorial research; paid links are optional and outside gameplay |

Each launch article identifies criteria, tradeoffs, limitations, alternatives, evaluation scope, review date, and a concrete action. Three of eight contain no paid links. The section is intentionally separate from game guides and does not repeat complete game instructions.

## My Arcade review (2026-08-21)

| Route | Visitor purpose and unique value | Next action | Deliberate boundary |
|---|---|---|---|
| `/my-arcade/` | A private, browser-local reference to recent play and each game's own saved result | Continue a game, read its guide, or clear local data | No account, sign-in, profile, avatar, sync, leaderboard, level, XP, achievement, badge, streak, daily reward, favourite, search, filter, notification, or social share |

The page reuses the existing Recently Played record and each game's existing keys rather than adding storage. Every
metric is labelled with the term the game itself uses, so Memory Match reports fewest moves while Word Tile Rush and
Color Flip report scores; no single number is calculated across unrelated games and no completion percentage exists.
A game with nothing stored says `No saved result in this browser yet.` rather than showing a zero. The route carries
no display advertisement and no affiliate link, which keeps local results visually separate from advertising; the
rest of the site's advertising is unchanged.
