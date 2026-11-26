import type {
  ArcadeItem,
  CatalogEntry,
  ContentSection,
  ContentStatus,
  ExperienceItem,
  GuideArticle,
  PublishedCatalogEntry,
  ToolItem,
} from './schemas';
import { guideArticles, toolEntries } from './entries';
import { CONTENT_SECTIONS } from './sections';
import { arcadeBatchEntries } from './arcade-batch';
import { phase4cArcadeEntries } from './arcade-phase4c';
import { phase3bToolEntries } from './phase3b-tools';
import { applicationIdentityAssets } from '../assets/applicationIdentityRegistry';

export type {
  ArcadeBreakEvent,
  ArcadeBreakPoint,
  ArcadeDocumentation,
  ArcadeGameOutcome,
  ArcadeGameRuntime,
  ArcadeItem,
  ArcadePauseReason,
  ArcadeRuntimeContractVersion,
  CatalogEntry,
  ContentSection,
  ContentStatus,
  ExperienceItem,
  GuideArticle,
  GuideSection,
  InteractiveModuleId,
  InteractiveModuleLoader,
  PublishedCatalogEntry,
  SEOFields,
  SectionDefinition,
  ToolItem,
} from './schemas';

const PUBLISHED_ON = '2026-11-16';
const COO_JOINT_FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61596369614569';

export { CONTENT_SECTIONS } from './sections';
import { getContentPath } from './sections';

export const contentRegistry: readonly CatalogEntry[] = [
  {
    id: 'arcade-pattern-pairs',
    slug: 'pattern-pairs',
    status: 'published',
    title: 'Pattern Pairs',
    summary: 'A compact memory game: turn over two tiles, remember the symbols, and clear the board with as few moves as you can.',
    section: 'arcade',
    kind: 'arcade',
    category: 'Puzzle',
    tags: ['memory', 'puzzle', 'focus', 'quick play'],
    featured: true,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'Pattern Pairs — a free browser memory game | NoCharge Arcade',
      description: 'Play Pattern Pairs, a free and mobile-friendly memory game. Match eight symbol pairs, track your moves and time, and start another round instantly.',
    },
    moduleId: 'pattern-pairs',
    moduleLoader: () => import('../modules/arcade/PatternPairs'),
    runtimeContract: 'nocharge-arcade-v1',
    h5Breakpoints: ['game-over'],
    relatedSlugs: ['focus-order-demo', 'reduced-motion-tester', 'a-local-first-workflow-for-browser-tools'],
    instructions: 'Choose two covered tiles at a time. A matching pair stays visible; a mismatch turns back over. Clear all eight pairs while keeping your move count low.',
    controls: ['Tap, click, or focus a tile and press Enter or Space.', 'Use New round to shuffle and restart.', 'Your move count and elapsed time update as you play.'],
    documentation: {
      howToPlay: [
        'The game begins with sixteen covered tiles arranged in a square. Each of eight symbols appears twice. Reveal one tile, study its mark and position, then reveal a different tile to make one attempt. You do not need to finish an attempt quickly; the clock measures elapsed play rather than counting down.',
        'A matching pair remains visible and is removed from later choices. When the marks differ, both tiles stay open briefly before turning face down again. Use that short reveal to store two locations in memory. The next attempt can use a remembered tile even if the other choice is new.',
        'Continue until the eight pairs have been found. The board reports completed pairs, attempts, and elapsed time so the result is visible without interpreting color or animation. A new round replaces the current arrangement, clears its move and time totals, and shuffles the symbols again.',
      ],
      controls: [
        'Every tile is a labeled button. Tap or click a covered tile, or move keyboard focus to it and activate it with Enter or Space. The accessible name reports its position and whether its symbol is currently visible.',
        'Choose two different unmatched tiles for an attempt. While a mismatch is being shown, other tile buttons are temporarily unavailable; wait for the board to return before starting the next attempt.',
        'Choose New round to abandon the current arrangement and reset its counters. The elapsed clock begins with the first accepted tile, not when the page opens.',
      ],
      rulesAndScoring: [
        'An attempt consists of two distinct tile selections and adds one to the move count. The two symbols either match or do not; there is no partial credit for remembering one of them. A tile that already belongs to a found pair cannot be selected again, and choosing the same face-up tile twice does not create an attempt.',
        'The round ends when all eight symbol pairs are matched. The game displays the number of attempts and the time spent, but it does not rank a player, deduct points for a mistake, or impose a speed target. A completed board is the only natural game-over state; an unfinished board remains playable until New round is chosen.',
        'A mismatch reveal delay is there to make both symbols readable. It is not a penalty and does not change the score. If the browser tab becomes hidden or loses focus, the module pauses its clock and input; returning to the page resumes the same board rather than consuming a move.',
      ],
      tips: [
        'Use a consistent location vocabulary, such as row then column, instead of describing a card only by a nearby symbol. A repeatable scan makes it easier to connect a newly revealed mark with an earlier one.',
        'When a mismatch appears, give yourself a moment to encode both locations before choosing again. If one symbol is already known, pair it with the new tile as soon as the other location becomes available.',
        'The minimum possible result is eight attempts because there are eight pairs. That is a mathematical floor, not a speed challenge. A careful extra move is ordinary play, and there is no benefit to rushing through an uncertain choice.',
      ],
      relatedIntro: 'For more on predictable keyboard movement, reduced-motion preferences, and local browser behavior, explore these independently authored NoCharge resources.',
    },
  },
  {
    id: 'arcade-sum-sprint',
    slug: 'sum-sprint',
    status: 'published',
    title: 'Sum Sprint',
    summary: 'A one-minute mental-math challenge with four answer choices, a visible streak, and a fresh set of sums each round.',
    section: 'arcade',
    kind: 'arcade',
    category: 'Quick play',
    tags: ['math', 'arithmetic', 'quick play', 'brain break'],
    featured: false,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'Sum Sprint — a one-minute mental math game | NoCharge Arcade',
      description: 'Try Sum Sprint, a free one-minute browser game with generated addition and subtraction questions, a score, a streak, and touch-friendly controls.',
    },
    moduleId: 'sum-sprint',
    moduleLoader: () => import('../modules/arcade/SumSprint'),
    runtimeContract: 'nocharge-arcade-v1',
    h5Breakpoints: ['game-over'],
    relatedSlugs: ['word-scoring', 'session-planner', 'a-local-first-workflow-for-browser-tools'],
    instructions: 'Start the round, solve each sum, and choose one of four answers before the minute ends. Correct answers add a point and extend your streak; a miss resets the streak.',
    controls: ['Tap or activate an answer button with Enter or Space.', 'Start a new 60-second round at any time.', 'Your score, streak, and remaining time are always visible.'],
    documentation: {
      howToPlay: [
        'A round lasts sixty seconds. Start it when you are ready, read the addition or subtraction prompt, and select the matching value from four choices. A new prompt appears after every accepted answer, so the task is to keep solving accurately while the same round clock continues.',
        'Correct answers increase the score and the current streak. An incorrect choice reveals the value of that problem and resets only the streak; it does not subtract points or end the session. Once the next prompt appears, continue with a clean choice rather than trying to repair the previous response.',
        'The display keeps score, streak, and seconds remaining together. When the timer reaches zero, the round stops and a result message appears. Starting again resets the round counters and creates a new question set; it does not continue the previous minute.',
      ],
      controls: [
        'Use Start 60-second round to begin. The four answer choices are standard buttons and work with touch, mouse, Enter, or Space when focused.',
        'Choose one answer for the current expression. Inputs are ignored until a round is active and while a page-visibility or browser-focus pause is in effect.',
        'Use Restart 60-second round to reset an active attempt, or Play again after time expires. The scoreboard remains visible while you answer.',
      ],
      rulesAndScoring: [
        'Each correct answer is worth one point. The streak counts consecutive correct responses and returns to zero after a wrong answer. The game has no negative score, lives, or per-question countdown; the only deadline is the visible one-minute round clock.',
        'Questions use addition and subtraction with non-negative results. Four distinct answer choices are generated for each prompt, including its correct result. The arithmetic is intentionally short enough to read at a glance, but the module does not claim to measure general mathematical ability or provide a curriculum score.',
        'The round ends when sixty seconds have elapsed or when the player deliberately restarts it. A natural H5 game-over callback is associated only with the elapsed-time result; choosing an answer, missing a question, or restarting is not an ad break. While the page is hidden or blurred, the timer is paused and resumes from the displayed remaining time.',
      ],
      tips: [
        'Read the operator and both values before scanning the choices. For subtraction, estimate whether the result should be close to zero or closer to the first value; for addition, use a quick tens adjustment to catch a choice that is clearly too large.',
        'Treat the streak as a separate signal from the score. One mistake resets consecutive accuracy but does not erase correct answers already earned, so the next question is a fresh opportunity rather than a reason to rush.',
        'If you need to stop, use Restart or leave the page; there is no saved round to recover. Compare your own results only under similar conditions, since generated questions vary and the module does not normalize a score by question difficulty.',
      ],
      relatedIntro: 'These NoCharge tools and guides cover a separate scoring formula, planning a short play session, and browser-local processing; they do not change this game’s answers or score.',
    },
  },
  {
    id: 'arcade-simon',
    slug: 'simon',
    status: 'published',
    title: 'Simon',
    summary: 'Watch a four-pad sequence, then repeat every cue in order. The sequence grows to twelve steps, with optional sound, readable pad names, and time to think between inputs.',
    section: 'arcade',
    kind: 'arcade',
    category: 'Sequence',
    tags: ['sequence', 'audio', 'recall', 'focus', 'quick play'],
    featured: false,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'Simon — a calm pattern-memory game | NoCharge Arcade',
      description: 'Play a four-pad sequence memory game with optional Web Audio, clear labels, a slower cue setting, and a defined twelve-step finish in your browser.',
    },
    relatedSlugs: ['focus-order-demo', 'reduced-motion-tester', 'a-practical-guide-to-interface-contrast'],
    moduleId: 'simon',
    moduleLoader: () => import('../modules/arcade/SimonSequence'),
    runtimeContract: 'nocharge-arcade-v1',
    h5Breakpoints: ['round-end', 'game-over'],
    instructions: 'Start a run, watch the pads cue one at a time, then repeat the complete sequence from its first cue. Each successful round adds one pad. A wrong pad ends the run; completing round twelve wins. Sound is optional and never starts before you enable it.',
    controls: [
      'Activate Begin run, then watch the labelled pads in sequence. A cue can be followed by silence; wait for the status to invite your response.',
      'Tap or click a pad, or move keyboard focus to one and press Enter or Space. Repeat the full sequence in order, not only its newest pad.',
      'Use Calm cues to lengthen the gaps and Sound to opt into local tones. The visibility and focus lifecycle pauses playback and input without changing the current sequence.',
      'Choose Next sequence after a correct round, Restart run at any time, or Play again after a win or mistake.',
    ],
    documentation: {
      howToPlay: [
        'A run begins with one cue on a four-pad panel. Watch which labelled pad becomes active, then wait until the game announces that input is ready. Select the same pad to answer the first cue. When the answer is correct, the round is complete and a new cue is added for the next sequence.',
        'Each new round starts its playback from the beginning. Your task is to reproduce every cue in the displayed order, including cues from earlier rounds. The sequence may repeat the same pad on neighboring steps; repeated cues still require separate activations.',
        'After a correct round, choose Next sequence when you are ready. There is no countdown during playback or while you decide. A wrong pad ends the current run, while a complete twelve-cue sequence is a win. Restart run makes a fresh attempt without keeping any pending timer from the previous one.',
      ],
      controls: [
        'Begin run and Play again are buttons. Each of the four pads is also a labeled button, so touch, mouse, and keyboard activation follow the same input path. Tab moves between available controls; Enter or Space activates the focused button.',
        'The Calm cues checkbox lengthens cue holds and the quiet intervals between them. It changes presentation timing only; it does not remove a cue, change its order, or extend the twelve-round target.',
        'Sound is off until explicitly enabled. When enabled, short tones are synthesized locally by Web Audio. Turning Sound off silences the module; no audio file, external player, or network stream is used.',
        'If the browser tab becomes hidden or loses window focus, the runtime pauses the current cue timer and suspends active audio. Returning to the page resumes the pending step with its remaining delay; the game does not skip ahead or accept hidden input.',
      ],
      rulesAndScoring: [
        'Round one contains one cue; each successful response below the target adds exactly one cue. The player always repeats the whole growing sequence. A selection during playback is unavailable, and only the next expected pad advances the input position.',
        'A wrong selection ends the run immediately and reveals a clear result message. Completing all twelve rounds is the winning terminal state. The game records the longest fully completed sequence during the current page visit; partial progress through a failed sequence does not count as a completed round.',
        'There is no speed bonus, penalty for waiting, or reward tied to audio. Calm cues and Sound do not alter the rules. `onRoundEnd` is raised only after a correct non-final sequence, and `onGameOver` only after a wrong input or the twelve-round win. Neither callback runs during cue playback or active player input.',
      ],
      tips: [
        'Name each pad using its visible word or icon, then make a short verbal or mental chunk. Two or three cues at a time are easier to retain than one long undifferentiated list, and the game leaves enough time to rehearse before responding.',
        'Keep repeated cues separate. A pattern such as Ring, Wave, Wave, Peak contains four activations even though two adjacent labels are the same. Do not collapse them into a single remembered event.',
        'Choose the slower cue setting if the standard display feels rushed, and turn sound on only if it helps your recall. The visual state and text labels remain available without audio, so sound is never the sole carrier of a cue.',
      ],
      relatedIntro: 'Use these separate NoCharge resources to explore keyboard focus order, reduced-motion behavior, and contrast review. They offer general interface guidance rather than clues to the current sequence.',
    },
  },
  ...arcadeBatchEntries,
  ...phase4cArcadeEntries,
  {
    id: 'experience-coos-joint-coffee-idle',

    slug: 'coosjoint',
    status: 'published',
    title: "Coo's Joint: Coffee Idle",
    summary: "Coo's Joint is an Android idle café game from ITTYBITTYBITES. This NoCharge page is a static showcase linking to the official product site, Google Play listing, itch.io prototype, and click-only trailer.",
    section: 'experiences',
    kind: 'experience',
    category: 'Games & Entertainment',
    tags: ['idle game', 'coffee', 'Android', 'itch.io prototype', 'official trailer'],
    featured: true,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: "Coo's Joint: Coffee Idle — official app showcase | NoCharge Experiences",
      description: "A static showcase for Coo's Joint with links to its official Android listing, product website, separate itch.io prototype, and click-to-load YouTube trailer. No NoCharge gameplay demo is hosted here.",
    },
    presentation: 'showcase',
    relatedSlugs: ['session-planner', 'ambient-mixer', 'a-local-first-workflow-for-browser-tools'],
    productWebsiteUrl: 'https://coosjoint.nocharge.net/',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.ittybittybites.cooscafe',
    itchIoUrl: 'https://ittybittybites.itch.io/coos-joint-idle-coffee-syndicate',
    facebookUrl: COO_JOINT_FACEBOOK_URL,
    youtubeTrailers: [{ title: "Coo's Joint official trailer", videoId: 'bNMkbd4iv-g' }],
    appLegalSlug: 'coosjoint',
    documentation: {
      overview: [
        "The Google Play listing presents Coo's Joint: Idle Coffee as a portrait-format, single-player idle café game. This NoCharge Experience is a release showcase, not a playable copy or a promise that its features match the current build.",
        'ITTYBITTYBITES also has a separate HTML5 prototype listing on itch.io. That creator-hosted project is distinct from the Android app; check each official destination for its current status, release notes, and availability.',
      ],
      keyFeatures: [
        "The publisher's Google Play listing describes a progression-based café game; the live listing is the source for current Android release details.",
        'A separate creator-owned itch.io page is labeled Prototype; it is not embedded in this NoCharge page.',
        'This route links to the official product website and verified app listing without hosting a game build.',
        'The official YouTube trailer is poster-first and loads only when a visitor presses Play.',
      ],
      platformAndAvailability: [
        'For the Android release, use the Google Play app-details page linked below. Device support, release status, store disclosures, and availability can change; the live listing is the current source.',
        'The creator-hosted itch.io page describes a separate HTML5 prototype. Opening that destination leaves NoCharge and uses the creator’s current build and page information.',
        'The trailer player starts as a local poster. It creates a YouTube embed only after an explicit play click, so the showcase makes no YouTube or Google video request on initial load.',
      ],
      faq: [
        { question: 'Can I play a Coo’s Joint demo on this NoCharge page?', answer: 'No. This route is an app showcase with outbound links. The Android app and the separate itch.io prototype remain on their official destinations; no local game demo or remote game embed is provided here.' },
        { question: 'Where can I check the Android release?', answer: 'Use the Google Play app-details link on this page for the current Android listing, supported-device information, publisher disclosures, and availability.' },
        { question: 'Does the trailer load automatically?', answer: 'No. The page first shows a local poster with a Play button. A YouTube player is created only after you select that button.' },
      ],
    },
  },
  {
    id: 'experience-two-second-witness',
    slug: 'twosecondwitness',
    status: 'published',
    title: 'The 2-Second Witness',
    summary: 'The 2-Second Witness is an Android memory game from ITTYBITTYBITES. This static showcase links to the official product site, Google Play listing, itch.io project, and click-only trailer; it contains no NoCharge gameplay demo.',
    section: 'experiences',
    kind: 'experience',
    category: 'Games & Entertainment',
    tags: ['memory game', 'observation', 'Android', 'itch.io project', 'official trailer'],
    featured: false,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'The 2-Second Witness — official app showcase | NoCharge Experiences',
      description: 'A static showcase for The 2-Second Witness with its official Android listing, product website, separate itch.io project, and click-to-load YouTube trailer. No NoCharge gameplay demo is hosted here.',
    },
    presentation: 'showcase',
    relatedSlugs: ['focus-order-demo', 'word-scoring', 'a-practical-guide-to-interface-contrast'],
    productWebsiteUrl: 'https://twosecondwitness.nocharge.net/',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.ittybittybites.the2secondwitness',
    itchIoUrl: 'https://ittybittybites.itch.io/2-second-witness',
    youtubeTrailers: [{ title: 'The 2-Second Witness official trailer', videoId: 'tOFySpe6yt0' }],
    appLegalSlug: 'twosecondwitness',
    documentation: {
      overview: [
        'The Google Play app-details page describes The 2-Second Witness as an Android memory game with timed pattern tasks and progression. This NoCharge Experience is a release showcase, not a playable copy or a substitute for the current app listing.',
        'The creator-owned itch.io page is a separate HTML5 project marked in development in the listing reviewed for this page. It is not embedded here; use each official destination for its current build, release status, and availability.',
      ],
      keyFeatures: [
        'The Play listing names reverse-sequence, odd-one-out, and pattern-matching challenges; check the live listing for the current release description.',
        'The separate itch.io page presents a creator-hosted HTML5 project and is not represented as the Android app build.',
        'This NoCharge route provides official destinations and publisher-supplied app policy links without a local game runtime.',
        'The official YouTube trailer uses a local poster and loads only after an explicit Play action.',
      ],
      platformAndAvailability: [
        'For the Android release and current device availability, use the Google Play app-details page linked below. Store descriptions and publisher disclosures can change over time.',
        'The creator’s itch.io project is a separate browser destination. Its page controls the project status and the current playable or in-development build; NoCharge does not embed or certify it.',
        'The trailer is click-to-load. Until a visitor chooses Play, this route makes no YouTube or Google video request and creates no remote player iframe.',
      ],
      faq: [
        { question: 'Is there a 2-Second Witness browser demo here?', answer: 'No. This route is a static showcase with official links. It does not recreate the Android game, embed the itch.io project, or load any gameplay module.' },
        { question: 'Where are the Android and browser project pages?', answer: 'The Google Play app-details page and the separate creator-owned itch.io project are linked in the Platform and Availability section. Check each for current release information.' },
        { question: 'Will the YouTube trailer contact Google when this page opens?', answer: 'No. The initial poster is local markup. The privacy-enhanced YouTube player is added only after the visitor presses Play.' },
      ],
    },
  },
  {
    id: 'experience-barn-road-chronicles',
    slug: 'barn-road-chronicles',
    status: 'published',
    title: 'Barn Road Chronicles: Act 1',
    summary: 'ITTYBITTYBITES lists Barn Road Chronicles: Act 1 as an HTML5 itch.io prototype. This NoCharge page is an outbound release showcase only; BRC is a future H5 Games Ads candidate.',
    section: 'experiences',
    kind: 'experience',
    category: 'Games & Entertainment',
    tags: ['mystery', 'point-and-click', 'HTML5', 'itch.io prototype', 'future H5 Games Ads candidate'],
    featured: false,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'Barn Road Chronicles: Act 1 — itch.io release | NoCharge Experiences',
      description: 'Open the creator-hosted HTML5 prototype on itch.io. This page is an outbound showcase only: Barn Road Chronicles is a future H5 Games Ads candidate, with no NoCharge browser demo or live ads.',
    },
    presentation: 'showcase',
    h5GamesAdsCandidate: true,
    relatedSlugs: ['session-planner', 'focus-order-demo', 'a-local-first-workflow-for-browser-tools'],
    itchIoUrl: 'https://ittybittybites.itch.io/barn-road-chronicles-act-1/',
    documentation: {
      overview: [
        'ITTYBITTYBITES lists Barn Road Chronicles: Act 1 as an HTML5 project on itch.io and marks the available build Prototype. The creator’s listing offers the game through itch.io’s Run game / Click to launch flow; this NoCharge page does not embed that player, fetch its assets, or claim to reproduce the game.',
        'The listing frames Act 1 as a mobile-first, touch-first point-and-click mystery, with a postcard clue, exploration, and a dark barn circuit in the creator’s description. It also describes browser save and optional audio. Those details describe the itch.io listing only; the creator controls the build, controls, and current availability.',
      ],
      keyFeatures: [
        'The creator’s itch.io page identifies the browser project as HTML5 and labels the currently listed build Prototype.',
        'The listing describes touch-first inspection, large targets, and safe-area spacing for its mobile-first presentation.',
        'The creator’s page mentions browser save and optional audio, including rain or barn ambience and voiceover.',
        'This NoCharge route contains one creator-owned itch.io destination and no local gameplay or third-party game iframe.',
        'Barn Road Chronicles is identified only as a future H5 Games Ads candidate; no live monetization is active here.',
      ],
      platformAndAvailability: [
        'Open the ITTYBITTYBITES itch.io page below to reach the creator-hosted browser build and current release notes. The listing was marked Prototype when reviewed; availability and status can change.',
        'The source listing presents a browser HTML5 project. This NoCharge route offers an outbound launch path only: the build was not embedded or mirrored because its direct player URL and host framing policy could not be verified cleanly.',
        'H5 Games Ads status: future candidate only. This route has no embedded game, Google provider script, publisher ID, or live ad placement. Google test ads cannot be exercised until a publisher ID is explicitly authorized and a verifiable build integration is available.',
      ],
      faq: [
        { question: 'Can I play Barn Road Chronicles inside this NoCharge page?', answer: 'No. The page links to the creator’s itch.io listing. The direct player URL and framing behavior were not verified, so no iframe or fabricated local demo is provided.' },
        { question: 'Is Barn Road Chronicles an Android or Google Play app?', answer: 'No Android or Google Play release is represented on this page. The reviewed release destination is the creator-owned itch.io HTML5 project.' },
        { question: 'Are Google H5 Games Ads running for BRC?', answer: 'No. BRC is only a future candidate. The Google SDK, publisher ID, live ads, and test-mode requests are absent; test mode is blocked pending an authorized publisher ID and a verifiable integration path.' },
      ],
    },
  },
  {
    id: 'experience-profivue-overview',
    slug: 'profivue',
    status: 'published',
    title: 'ProfiVue',
    summary: 'ProfiVue is an Android reseller calculator for marketplace fees, estimated profit, ROI, margin, and break-even price; this NoCharge overview summarizes its described workflows and points to the official product website for current details.',
    section: 'experiences',
    kind: 'experience',
    category: 'Productivity & Utilities',
    tags: ['reselling', 'profit calculator', 'marketplace fees', 'pricing', 'ROI', 'Android'],
    featured: false,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'ProfiVue — reseller profit and fee calculator | NoCharge Experiences',
      description: 'Learn how ProfiVue describes marketplace fee, profit, ROI, margin, break-even, and tax-reserve estimates for resellers. Check the official site for current coverage.',
    },
    presentation: 'editorial-mini-site',
    appLegalSlug: 'profivue',
    relatedSlugs: ['json-workbench', 'storage-inspector', 'a-local-first-workflow-for-browser-tools'],
    productWebsiteUrl: 'https://profivue.nocharge.net/',
    documentation: {
      directAnswer: 'ProfiVue is an Android calculator for resale pricing: select a marketplace profile, enter an item cost, expected selling price, and related expenses, then review estimated profit, ROI, margin, and break-even price. Its public description also lists a tax reserve and custom profiles.',
      overview: [
        'ProfiVue is presented as a profit-and-fee calculator for people who source items to resell. Its described calculation brings together an acquisition cost, an expected sale amount, marketplace charges, shipping, packaging, and other expenses so a seller can estimate what a transaction may leave behind.',
        'The current public description names eBay, Amazon, Poshmark, Mercari, Etsy, Depop, and Facebook Marketplace, and also refers to custom profiles for local or niche channels. This overview restates those public details; it does not guarantee that every fee schedule, market, field, or calculation remains current.',
      ],
      keyFeatures: [
        'Compare estimated proceeds after marketplace fees, shipping, packaging, and other expenses are considered alongside purchase cost and expected sale price.',
        'Review several reported pricing measures, including net-profit estimate, return on investment, profit margin, and a break-even sale price.',
        'Set an optional tax-reserve percentage as part of a preliminary estimate; this does not replace professional tax advice or a jurisdiction-specific calculation.',
        'The public feature list names Sell For and Pay Max; verify the current controls, inputs, and calculations before using either label to make a pricing decision.',
        'Use named marketplace options or create a custom profile for local and niche channels, then confirm the exact fee assumptions before making a decision.',
        'The latest public release notes mention local-first backup and restore in JSON or through Google Drive, import, CSV export, and database migration updates. They do not establish which records each option covers or the exact network behavior, so verify those details before relying on them.',
      ],
      workflows: [
        {
          title: 'Set a purchase ceiling before sourcing',
          summary: 'Use the estimate as a screening step before committing money to an item, with the expected channel and costs made explicit.',
          steps: [
            'Choose the marketplace profile that best matches the place where you expect to sell the item.',
            'Enter the purchase amount and a realistic expected sale price, then include shipping, packaging, and any other costs you expect to pay.',
            'Review the resulting fee estimate, net-profit estimate, margin, ROI, and break-even figure together rather than relying on one headline score.',
            'If the current app offers a Pay Max control, inspect its inputs and assumptions before treating the result as a sourcing ceiling; independently check every fee and tax assumption.',
          ],
        },
        {
          title: 'Check a target price before listing',
          summary: 'Work from the costs and channel you intend to use, then compare the estimate with a price buyers are likely to accept.',
          steps: [
            'Record the item cost and the expenses that apply to the sale, including shipping and packing supplies.',
            'Select or review the marketplace fee profile and inspect how its charges affect the estimated amount remaining.',
            'Compare a proposed price with the break-even result and the desired margin instead of assuming the listed price equals take-home profit.',
            'If Sell For is available in your version, inspect its stated inputs and calculation before treating any result as a target price; compare it with current market prices and fees.',
          ],
        },
        {
          title: 'Compare marketplace assumptions',
          summary: 'Evaluate a channel choice by comparing the profile inputs, not by treating a built-in rate as a permanent promise.',
          steps: [
            'Review the marketplace profile that corresponds to the channel under consideration, or create a custom profile when appropriate.',
            'Make sure the percentage and fixed-fee assumptions reflect the current marketplace, category, and transaction details that apply to your item.',
            'Compare the resulting estimates with the same cost and sale-price assumptions so the channel comparison is meaningful.',
            'Keep any exported history or backup in a location and format that fit your own privacy and recordkeeping needs.',
          ],
        },
      ],
      useCases: [
        { title: 'Resale sourcing', description: 'Screen a potential purchase against a planned resale price and a maximum amount you are comfortable paying.' },
        { title: 'Pre-listing price review', description: 'See how selling charges and fulfilment costs can change an expected margin before choosing an asking price.' },
        { title: 'Channel comparison', description: 'Compare marketplace profiles or model a local sales channel with a custom profile and explicit assumptions.' },
        { title: 'Recordkeeping options', description: 'Review the publicly described backup, restore, import, and CSV options, then verify their current data scope and privacy behavior before using them.' },
      ],
      evaluationQuestions: [
        'Does the selected profile include the current fee rules for your marketplace, region, category, and transaction type?',
        'How should a user-set tax reserve be interpreted for their own filing situation, and which questions require a tax professional?',
        'Which fields are included in JSON backup, restore, or CSV export, and what happens when the optional Google Drive path is used?',
        'Are Sell For and Pay Max available in the version you use, and do their estimates include every relevant payment, shipping, or promotion charge?',
      ],
      artwork: applicationIdentityAssets.profivue.map((asset, index) => ({
        ...asset,
        alt: [
          'ProfiVue product image showing an example purchase-price estimate with shipping, packaging, a tax-reserve field, marketplace profile choices, and projected profit.',
          'ProfiVue product image with a sample cost breakdown for purchase price, selling and processing fees, shipping, packaging, total cost, ROI, margin, and break-even.',
          'ProfiVue product image showing several named marketplace fee profiles and independent profile choices.',
        ][index],
        caption: [
          'A sample estimate combines an expected sale with purchase and fulfilment costs.',
          'A cost view separates fees and expenses from the reported profit metrics.',
          'Marketplace and custom-profile options are shown as product imagery, not live fee data.',
        ][index],
      })),
      platformAndAvailability: [
        'The public product description reviewed for this page presents ProfiVue as an Android productivity application. Version, supported marketplaces, pricing, and availability can change; the official ProfiVue website is the destination for current product information.',
        'This NoCharge page is an editorial overview, not a working calculator, an accounting system, financial advice, or a promise that a marketplace fee estimate is complete. Review the assumptions and official product details before relying on a result.',
      ],
      faq: [
        { question: 'What does ProfiVue help a reseller estimate?', answer: 'Its described workflow combines an item cost and expected sale price with marketplace fees and other expenses, then presents estimated profit, ROI, margin, and break-even information.' },
        { question: 'Which selling channels are named in the current description?', answer: 'It names eBay, Amazon, Poshmark, Mercari, Etsy, Depop, and Facebook Marketplace, and mentions custom marketplace profiles. Confirm current support and fee assumptions on the official ProfiVue website.' },
        { question: 'Does a tax-reserve percentage make the result tax advice?', answer: 'No. The described tax reserve is an input for estimating a set-aside; it does not establish a user’s tax liability, replace professional advice, or guarantee that a calculation fits a specific jurisdiction.' },
        { question: 'Are marketplace fees guaranteed to be current?', answer: 'No fee schedule should be treated as permanent. Check the applicable marketplace rules and profile assumptions for the transaction you are considering, then confirm the current product behavior through the official site.' },
        { question: 'Can Sell For or Pay Max determine a safe purchase price or required sale price?', answer: 'The public feature list names both controls, but this overview has not independently verified their current inputs, outputs, or calculation rules. Confirm the current behavior and assumptions before using either result for a decision.' },
      ],
    },
  },
  {
    id: 'experience-rideside-overview',
    slug: 'rideside',
    status: 'published',
    title: 'RideSide',
    summary: 'RideSide is a boat and personal-watercraft organizer for checklists, watercraft details, and ride notes, with reusable templates and weather information when available; see the official product website for current details.',
    section: 'experiences',
    kind: 'experience',
    category: 'Productivity & Utilities',
    tags: ['watercraft', 'boating', 'personal watercraft', 'checklists', 'ride notes', 'weather', 'Android'],
    featured: false,
    publishedAt: PUBLISHED_ON,
    updatedAt: PUBLISHED_ON,
    seo: {
      title: 'RideSide — boat and personal-watercraft checklists | NoCharge Experiences',
      description: 'Explore RideSide’s described checklists, watercraft details, trip notes, templates, and weather snapshot for boat and PWC rides. Confirm current behavior on the official site.',
    },
    presentation: 'editorial-mini-site',
    appLegalSlug: 'rideside',
    relatedSlugs: ['session-planner', 'random-activity', 'a-local-first-workflow-for-browser-tools'],
    productWebsiteUrl: 'https://rideside.nocharge.net/',
    documentation: {
      directAnswer: 'RideSide is a boat and personal-watercraft organizer that keeps reusable checklists, watercraft details, and ride notes together. Its current public description also mentions a weather snapshot when available and says ride information can be kept on-device without an account.',
      overview: [
        'RideSide: Checklist is described as a digital notebook for boat and personal-watercraft owners. Its stated purpose is to keep preparation lists, craft information, and trip notes in one place, rather than asking a rider to reconstruct those details from separate notes each time.',
        'The product description refers to checklists for before, during, or after a ride; reusable templates; records about boats or PWCs; and notes about trips, locations, and costs. It also mentions a weather snapshot when available. These details do not establish live navigation, dispatch, continuous location tracking, or a guaranteed forecast source.',
      ],
      keyFeatures: [
        'Create checklists for items to prepare before, monitor during, or review after a boat or personal-watercraft ride.',
        'Keep information and notes about boats and PWCs together so a rider can refer back to details about their own watercraft.',
        'Save ride notes; a listing image shows a sample location and cost, but verify which note fields the current product actually supports.',
        'Start from reusable checklist templates when a routine ride does not need a list built from scratch.',
        'View a weather snapshot for a ride location when the feature is available; the description does not promise coverage or freshness in every place.',
        'The product description says ride information is stored on the device and an account is not required; published data disclosures separately mention device or other identifiers, so these statements are not a no-network guarantee.',
      ],
      workflows: [
        {
          title: 'Prepare a repeatable watercraft checklist',
          summary: 'Use a checklist as a reminder framework, then confirm which categories and template fields the current product supports.',
          steps: [
            'Choose a reusable template or create a list that matches the boat or PWC ride you are preparing for.',
            'Organize the checks around the moments the product describes: before the ride, during it, and after returning.',
            'Review each item in context and update the list to reflect your own equipment, location, and operating requirements.',
            'Use the official product information for current instructions; this overview does not substitute for a vessel manual or required safety procedure.',
          ],
        },
        {
          title: 'Keep watercraft details close to trip notes',
          summary: 'Treat the app as an organizer for reference information and confirm exactly which detail fields are available.',
          steps: [
            'Select the boat or personal watercraft associated with the outing, if the current app offers that choice.',
            'Keep the craft information you want to remember in the fields the app actually provides; do not assume that it records every maintenance or registration detail.',
            'After a ride, add the location, cost, or other personal notes that are useful for your own history.',
            'Check the available backup, export, and deletion behavior before using the app for sensitive or important records.',
          ],
        },
        {
          title: 'Review weather and ride history carefully',
          summary: 'Use an available snapshot as a convenience, not as a substitute for a current marine forecast or local safety guidance.',
          steps: [
            'Check whether a weather snapshot is available for the location and time you have in mind.',
            'Confirm the observation time, source, coverage, and any location permission the feature requires before interpreting the result.',
            'Add the trip notes you want to retain and check them later as personal reference, not as proof of a complete route trace.',
            'Use official local forecasts and safety information for operational decisions on the water.',
          ],
        },
      ],
      useCases: [
        { title: 'Routine launch preparation', description: 'Keep a repeatable list for equipment and checks that you want to remember before a regular outing.' },
        { title: 'More than one watercraft', description: 'Organize boat or PWC reference details alongside notes tied to particular rides.' },
        { title: 'Personal ride journal', description: 'Keep selected trip, location, and cost notes together for later review.' },
        { title: 'Weather context', description: 'Look at an available weather snapshot as supplemental context, while relying on authoritative and current sources for safety.' },
      ],
      evaluationQuestions: [
        'Which watercraft fields and template options are supported, and can separate checklists be kept for different boats or PWCs?',
        'Where does the weather snapshot come from, how recent is it, and what location or network permission is needed?',
        'Does the app back up, export, or restore ride records, and how can a user remove device data or identifiers?',
        'What works without a connection, and which parts of the interface depend on a network or current location?',
        'Does the current product provide any navigation or live tracking, or should riders use separate marine tools for those tasks?',
      ],
      artwork: applicationIdentityAssets.rideside.map((asset, index) => ({
        ...asset,
        alt: [
          'RideSide product image showing a sample personal-watercraft trip memory card with a location, checklist completion, weather snapshot, duration, and cost summary.',
          'RideSide product image showing a pre-ride personal-watercraft checklist with life jacket, ignition key, fuel, fluids, safety gear, and registration reminders.',
        ][index],
        caption: [
          'A sample trip summary brings selected ride notes and cost information together.',
          'A sample watercraft list illustrates the checklist format described for preparation.',
        ][index],
      })),
      platformAndAvailability: [
        'The public description reviewed for this page presents RideSide as a mobile productivity app for boat and personal-watercraft riders. Product version and platform availability can change; check the official RideSide website for current details.',
        'The product description says ride information is kept on the device and the app can be used without an account. Its published data disclosure also indicates device or other identifiers may be collected or shared and says deletion is not available through the described controls. Confirm current privacy and recovery behavior before adding sensitive locations or costs.',
        'This NoCharge page is a static editorial overview, not a RideSide web app, driver dashboard, navigation system, live trip tracker, or safety checklist. Use current official instructions and local boating guidance for decisions on the water.',
      ],
      faq: [
        { question: 'Is RideSide intended for boats or personal watercraft?', answer: 'Yes. Its current product description frames RideSide: Checklist as a digital notebook for boats and PWCs, with checklists, watercraft details, and ride notes.' },
        { question: 'Can checklists cover more than preparation?', answer: 'The description says lists can be used for things to have ready before, during, or after a ride and mentions reusable templates. Confirm the exact categories and controls in the current product.' },
        { question: 'Does RideSide provide live navigation or driver dispatch?', answer: 'Those capabilities are not established by the product description reviewed for this overview. Do not infer route tracking, navigation, or driver dispatch from the product name; check the official site for its current scope.' },
        { question: 'Is the weather snapshot always available?', answer: 'No such guarantee is stated. The description qualifies weather information as available when possible, so check its location coverage, source, and freshness and use a current marine forecast for safety decisions.' },
        { question: 'Does RideSide need an account, and what about privacy?', answer: 'The product description says ride information is stored on-device and an account is not required. A separate published data disclosure mentions device or other identifiers; confirm the current privacy, backup, and deletion behavior before entering sensitive records.' },
      ],
    },
  },
  ...toolEntries,
  ...phase3bToolEntries,
  ...guideArticles,
];

export interface RegistryIssue {
  code: 'duplicate-id' | 'duplicate-slug' | 'duplicate-seo-title' | 'duplicate-seo-description'
    | 'invalid-status' | 'invalid-slug' | 'invalid-field' | 'invalid-date' | 'invalid-section'
    | 'invalid-kind' | 'invalid-content' | 'invalid-related-link' | 'placeholder-content'
    | 'tool-word-count' | 'guide-word-count' | 'arcade-word-count' | 'experience-word-count';
  message: string;
  entryId?: string;
  slug?: string;
}

const VALID_STATUSES = new Set<ContentStatus>(['draft', 'published', 'archived']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TOOL_MIN_WORDS = 400;
const GUIDE_MIN_WORDS = 800;
const EXPERIENCE_MIN_WORDS = 300;
const PLACEHOLDER_PATTERNS = [
  /\blorem\s+ipsum\b/iu,
  /\b(?:todo|tbd)\b/iu,
  /\bcoming\s+soon\b/iu,
  /\bunder\s+construction\b/iu,
  /\bplaceholder\s+(?:text|content|copy)\b/iu,
  /\b(?:your|insert)\s+(?:text|content|copy|name)\s+here\b/iu,
  /\bto\s+be\s+written\b/iu,
  /\b(?:replace\s+me|fill\s+this\s+in|add\s+content\s+here)\b/iu,
] as const;
const SECTION_KIND: Readonly<Record<ContentSection, CatalogEntry['kind']>> = {
  arcade: 'arcade',
  experiences: 'experience',
  tools: 'tool',
  guides: 'guide',
};

function isRealDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidProductWebsiteUrl(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname.endsWith('.nocharge.net')
      && url.port === ''
      && url.pathname === '/'
      && url.search === ''
      && url.hash === ''
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function isValidGooglePlayUrl(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'play.google.com'
      && url.port === ''
      && url.pathname === '/store/apps/details'
      && /^[A-Za-z0-9_.]+$/u.test(url.searchParams.get('id') ?? '')
      && !url.hash;
  } catch {
    return false;
  }
}

function isValidItchIoUrl(value: unknown): value is string {
  if (!nonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'ittybittybites.itch.io'
      && url.port === ''
      && ['/coos-joint-idle-coffee-syndicate', '/2-second-witness', '/barn-road-chronicles-act-1/'].includes(url.pathname)
      && url.search === ''
      && url.hash === ''
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function isValidCooJointFacebookUrl(value: unknown): value is string {
  return value === COO_JOINT_FACEBOOK_URL;
}

function collectProse(entry: CatalogEntry): string[] {
  const prose = [typeof entry.summary === 'string' ? entry.summary : ''];
  if (entry.kind === 'tool') {
    if (typeof entry.instructions === 'string') prose.push(entry.instructions);
    if (Array.isArray(entry.controls)) prose.push(...entry.controls.filter((item): item is string => typeof item === 'string'));
    if (Array.isArray(entry.howItWorks)) prose.push(...entry.howItWorks.filter((item): item is string => typeof item === 'string'));
    if (entry.workedExample && typeof entry.workedExample === 'object') {
      const example = entry.workedExample;
      if (typeof example.scenario === 'string') prose.push(example.scenario);
      if (typeof example.input === 'string') prose.push(example.input);
      if (Array.isArray(example.steps)) prose.push(...example.steps.filter((item): item is string => typeof item === 'string'));
      if (typeof example.result === 'string') prose.push(example.result);
    }
    if (Array.isArray(entry.pitfalls)) prose.push(...entry.pitfalls.filter((item): item is string => typeof item === 'string'));
    if (Array.isArray(entry.faq)) {
      for (const item of entry.faq) {
        if (!item || typeof item !== 'object') continue;
        if (typeof item.question === 'string') prose.push(item.question);
        if (typeof item.answer === 'string') prose.push(item.answer);
      }
    }
  } else if (entry.kind === 'arcade') {
    const documentation = entry.documentation;
    if (typeof entry.instructions === 'string') prose.push(entry.instructions);
    if (Array.isArray(entry.controls)) prose.push(...entry.controls.filter((item): item is string => typeof item === 'string'));
    if (documentation && typeof documentation === 'object') {
      for (const section of [documentation.howToPlay, documentation.controls, documentation.rulesAndScoring, documentation.tips]) {
        if (Array.isArray(section)) prose.push(...section.filter((item): item is string => typeof item === 'string'));
      }
      if (typeof documentation.relatedIntro === 'string') prose.push(documentation.relatedIntro);
    }
  } else if (entry.kind === 'experience') {
    if (typeof entry.instructions === 'string') prose.push(entry.instructions);
    if (Array.isArray(entry.controls)) prose.push(...entry.controls.filter((item): item is string => typeof item === 'string'));
    const documentation = entry.documentation;
    if (documentation && typeof documentation === 'object') {
      if (typeof documentation.directAnswer === 'string') prose.push(documentation.directAnswer);
      for (const section of [documentation.overview, documentation.keyFeatures, documentation.howDemoWorks, documentation.platformAndAvailability, documentation.evaluationQuestions]) {
        if (Array.isArray(section)) prose.push(...section.filter((item): item is string => typeof item === 'string'));
      }
      if (Array.isArray(documentation.workflows)) {
        for (const workflow of documentation.workflows) {
          if (!workflow || typeof workflow !== 'object') continue;
          if (typeof workflow.title === 'string') prose.push(workflow.title);
          if (typeof workflow.summary === 'string') prose.push(workflow.summary);
          if (Array.isArray(workflow.steps)) prose.push(...workflow.steps.filter((item: unknown): item is string => typeof item === 'string'));
        }
      }
      if (Array.isArray(documentation.useCases)) {
        for (const useCase of documentation.useCases) {
          if (!useCase || typeof useCase !== 'object') continue;
          if (typeof useCase.title === 'string') prose.push(useCase.title);
          if (typeof useCase.description === 'string') prose.push(useCase.description);
        }
      }
      if (Array.isArray(documentation.artwork)) {
        for (const artwork of documentation.artwork) {
          if (!artwork || typeof artwork !== 'object') continue;
          if (typeof artwork.alt === 'string') prose.push(artwork.alt);
          if (typeof artwork.caption === 'string') prose.push(artwork.caption);
        }
      }
      if (Array.isArray(documentation.faq)) {
        for (const item of documentation.faq) {
          if (!item || typeof item !== 'object') continue;
          if (typeof item.question === 'string') prose.push(item.question);
          if (typeof item.answer === 'string') prose.push(item.answer);
        }
      }
    }
  } else if (entry.kind === 'guide' && Array.isArray(entry.sections)) {
    for (const section of entry.sections) {
      if (!section || typeof section !== 'object') continue;
      if (Array.isArray(section.paragraphs)) prose.push(...section.paragraphs.filter((item: unknown): item is string => typeof item === 'string'));
      if (Array.isArray(section.steps)) prose.push(...section.steps.filter((item: unknown): item is string => typeof item === 'string'));
    }
  }
  return prose;
}

/** Counts prose once per distinct normalized sentence, so duplicated filler cannot satisfy a publication gate. */
export function countUniqueProseWords(prose: readonly string[]): number {
  const seenSentences = new Set<string>();
  let count = 0;
  for (const block of prose) {
    if (!nonEmptyString(block)) continue;
    const sentences = block.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/gu) ?? [block];
    for (const sentence of sentences) {
      const normalized = sentence
        .normalize('NFKC')
        .toLocaleLowerCase()
        .replace(/[’‘]/gu, "'")
        .replace(/[^\p{Letter}\p{Number}']+/gu, ' ')
        .trim();
      if (!normalized || seenSentences.has(normalized)) continue;
      seenSentences.add(normalized);
      count += normalized.match(/[\p{Letter}\p{Number}]+(?:'[\p{Letter}\p{Number}]+)*/gu)?.length ?? 0;
    }
  }
  return count;
}

function collectPublicText(entry: CatalogEntry): string[] {
  const text = [entry.title, entry.summary, entry.seo?.title, entry.seo?.description];
  if (entry.kind === 'tool') {
    text.push(entry.instructions, ...(Array.isArray(entry.controls) ? entry.controls : []));
    if (Array.isArray(entry.howItWorks)) text.push(...entry.howItWorks);
    if (entry.workedExample && typeof entry.workedExample === 'object') {
      text.push(entry.workedExample.scenario, entry.workedExample.input ?? '', entry.workedExample.result);
      if (Array.isArray(entry.workedExample.steps)) text.push(...entry.workedExample.steps);
    }
    if (Array.isArray(entry.pitfalls)) text.push(...entry.pitfalls);
    if (Array.isArray(entry.faq)) {
      for (const item of entry.faq) {
        if (item && typeof item === 'object') text.push(item.question, item.answer);
      }
    }
  } else if (entry.kind === 'arcade') {
    text.push(entry.instructions, ...(Array.isArray(entry.controls) ? entry.controls : []));
    const documentation = entry.documentation;
    if (documentation && typeof documentation === 'object') {
      text.push(documentation.relatedIntro);
      for (const section of [documentation.howToPlay, documentation.controls, documentation.rulesAndScoring, documentation.tips]) {
        if (Array.isArray(section)) text.push(...section);
      }
    }
  } else if (entry.kind === 'experience') {
    text.push(entry.instructions ?? '', ...(Array.isArray(entry.controls) ? entry.controls : []));
    const documentation = entry.documentation;
    if (documentation && typeof documentation === 'object') {
      text.push(documentation.directAnswer ?? '');
      for (const section of [documentation.overview, documentation.keyFeatures, documentation.howDemoWorks, documentation.platformAndAvailability, documentation.evaluationQuestions]) {
        if (Array.isArray(section)) text.push(...section);
      }
      if (Array.isArray(documentation.workflows)) {
        for (const workflow of documentation.workflows) {
          if (workflow && typeof workflow === 'object') text.push(workflow.title, workflow.summary, ...(Array.isArray(workflow.steps) ? workflow.steps : []));
        }
      }
      if (Array.isArray(documentation.useCases)) {
        for (const useCase of documentation.useCases) {
          if (useCase && typeof useCase === 'object') text.push(useCase.title, useCase.description);
        }
      }
      if (Array.isArray(documentation.artwork)) {
        for (const artwork of documentation.artwork) {
          if (artwork && typeof artwork === 'object') text.push(artwork.alt, artwork.caption);
        }
      }
      if (Array.isArray(documentation.faq)) {
        for (const item of documentation.faq) {
          if (item && typeof item === 'object') text.push(item.question, item.answer);
        }
      }
    }
  } else if (entry.kind === 'guide' && Array.isArray(entry.sections)) {
    for (const section of entry.sections) {
      if (!section || typeof section !== 'object') continue;
      text.push(section.heading);
      if (Array.isArray(section.paragraphs)) text.push(...section.paragraphs);
      if (Array.isArray(section.steps)) text.push(...section.steps);
    }
  }
  return text.filter((value): value is string => typeof value === 'string');
}

function validateOne(entry: CatalogEntry, index: number): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const candidate = entry !== null && typeof entry === 'object'
    ? entry as CatalogEntry & { status: string; section: string; kind: string }
    : {} as CatalogEntry & { status: string; section: string; kind: string };
  const issue = (code: RegistryIssue['code'], message: string) => issues.push({
    code,
    message,
    entryId: nonEmptyString(candidate.id) ? candidate.id : `row-${index + 1}`,
    ...(nonEmptyString(candidate.slug) ? { slug: candidate.slug } : {}),
  });

  if (!nonEmptyString(candidate.id)) issue('invalid-field', 'id must be a non-empty string.');
  if (!nonEmptyString(candidate.slug) || !SLUG_PATTERN.test(candidate.slug)) issue('invalid-slug', 'slug must use lowercase letters, digits, and single hyphens.');
  if (!VALID_STATUSES.has(candidate.status as ContentStatus)) issue('invalid-status', `status must be draft, published, or archived (received ${String(candidate.status)}).`);
  if (!nonEmptyString(candidate.title)) issue('invalid-field', 'title is required.');
  if (!nonEmptyString(candidate.summary) || candidate.summary.trim().length < 24) issue('invalid-field', 'summary must contain at least 24 characters.');
  if (!CONTENT_SECTIONS.some((section) => section.id === candidate.section)) issue('invalid-section', `unknown section ${String(candidate.section)}.`);
  if (CONTENT_SECTIONS.some((section) => section.id === candidate.section) && SECTION_KIND[candidate.section as ContentSection] !== candidate.kind) {
    issue('invalid-kind', `kind ${candidate.kind} does not match section ${candidate.section}.`);
  }
  if (!nonEmptyString(candidate.category)) issue('invalid-field', 'category is required.');
  if (!Array.isArray(candidate.tags) || candidate.tags.length === 0 || candidate.tags.some((tag) => !nonEmptyString(tag))) {
    issue('invalid-field', 'tags must contain at least one non-empty string.');
  } else {
    const normalizedTags = candidate.tags.map((tag) => tag.trim().toLocaleLowerCase());
    if (new Set(normalizedTags).size !== normalizedTags.length) issue('invalid-field', 'tags must not contain duplicates.');
  }
  if (typeof candidate.featured !== 'boolean') issue('invalid-field', 'featured must be an explicit boolean.');
  if (!nonEmptyString(candidate.publishedAt) || !isRealDate(candidate.publishedAt)) issue('invalid-date', 'publishedAt must be a valid YYYY-MM-DD date.');
  if (!nonEmptyString(candidate.updatedAt) || !isRealDate(candidate.updatedAt)) issue('invalid-date', 'updatedAt must be a valid YYYY-MM-DD date.');
  if (nonEmptyString(candidate.publishedAt) && nonEmptyString(candidate.updatedAt)
    && isRealDate(candidate.publishedAt) && isRealDate(candidate.updatedAt)
    && candidate.updatedAt < candidate.publishedAt) issue('invalid-date', 'updatedAt must not be earlier than publishedAt.');
  if (!candidate.seo || !nonEmptyString(candidate.seo.title) || !nonEmptyString(candidate.seo.description)) {
    issue('invalid-field', 'seo.title and seo.description are required.');
  }

  if (candidate.relatedSlugs !== undefined) {
    if (!Array.isArray(candidate.relatedSlugs) || candidate.relatedSlugs.some((slug: unknown) => !nonEmptyString(slug) || !SLUG_PATTERN.test(slug))) {
      issue('invalid-related-link', 'relatedSlugs must be an array of valid lowercase content slugs.');
    } else if (new Set(candidate.relatedSlugs.map((slug) => slug.toLocaleLowerCase())).size !== candidate.relatedSlugs.length) {
      issue('invalid-related-link', 'relatedSlugs must not contain duplicates.');
    }
  }

  const editorialExperience = candidate.kind === 'experience'
    && (candidate as ExperienceItem).presentation === 'editorial-mini-site';
  const showcaseExperience = candidate.kind === 'experience'
    && (candidate as ExperienceItem).presentation === 'showcase';
  if (candidate.kind === 'arcade' || candidate.kind === 'experience' || candidate.kind === 'tool') {
    const interactive = candidate as ArcadeItem | ExperienceItem | ToolItem;
    if (!editorialExperience && !showcaseExperience) {
      if (!nonEmptyString(interactive.moduleId)) issue('invalid-content', 'interactive entries require a moduleId.');
      if (typeof interactive.moduleLoader !== 'function') issue('invalid-content', 'interactive entries require a lazy module loader.');
      if (!nonEmptyString(interactive.instructions) || interactive.instructions.trim().length < 40) issue('invalid-content', 'interactive entries require substantive instructions.');
      if (!Array.isArray(interactive.controls) || interactive.controls.length === 0 || interactive.controls.some((control) => !nonEmptyString(control))) {
        issue('invalid-content', 'interactive entries require a non-empty controls list.');
      }
    }
    if (candidate.kind === 'arcade' && candidate.status === 'published') {
      const arcade = candidate as ArcadeItem;
      const documentation = arcade.documentation;
      if (arcade.runtimeContract !== 'nocharge-arcade-v1') {
        issue('invalid-content', 'published Arcade games require the nocharge-arcade-v1 runtime contract.');
      }
      if (!Array.isArray(arcade.h5Breakpoints) || arcade.h5Breakpoints.length === 0
        || arcade.h5Breakpoints.some((point) => point !== 'round-end' && point !== 'game-over')
        || new Set(arcade.h5Breakpoints).size !== arcade.h5Breakpoints.length) {
        issue('invalid-content', 'published Arcade games require unique, natural round-end or game-over H5 breakpoints.');
      }
      const editorialSections = [
        ['How to Play', documentation?.howToPlay],
        ['Controls', documentation?.controls],
        ['Rules & Scoring', documentation?.rulesAndScoring],
        ['Tips', documentation?.tips],
      ] as const;
      for (const [name, paragraphs] of editorialSections) {
        if (!Array.isArray(paragraphs) || paragraphs.length < 3
          || paragraphs.some((paragraph) => !nonEmptyString(paragraph) || paragraph.trim().length < 80)) {
          issue('invalid-content', `published Arcade games require at least three substantive ${name} items.`);
        }
      }
      if (!documentation || !nonEmptyString(documentation.relatedIntro) || documentation.relatedIntro.trim().length < 80) {
        issue('invalid-content', 'published Arcade games require an authored Related Guides & Tools introduction.');
      }
      if (!Array.isArray(arcade.relatedSlugs) || arcade.relatedSlugs.length === 0) {
        issue('invalid-related-link', 'published Arcade games require related published guides or tools.');
      }
      const words = countUniqueProseWords(collectProse(arcade));
      if (words < 400) issue('arcade-word-count', `published Arcade game has ${words} unique explanatory words; at least 400 are required.`);
    }
    if (candidate.kind === 'tool' && candidate.status === 'published') {
      const tool = candidate as ToolItem;
      if (!Array.isArray(tool.howItWorks) || tool.howItWorks.length < 2
        || tool.howItWorks.some((paragraph) => !nonEmptyString(paragraph) || paragraph.trim().length < 80)) {
        issue('invalid-content', 'published tools require at least two substantive howItWorks paragraphs.');
      }
      const example = tool.workedExample;
      if (!example || typeof example !== 'object' || !nonEmptyString(example.scenario)
        || !Array.isArray(example.steps) || example.steps.length < 2 || example.steps.some((step) => !nonEmptyString(step))
        || !nonEmptyString(example.result)) {
        issue('invalid-content', 'published tools require a complete workedExample with a scenario, steps, and result.');
      }
      if (!Array.isArray(tool.pitfalls) || tool.pitfalls.length === 0 || tool.pitfalls.some((pitfall) => !nonEmptyString(pitfall))) {
        issue('invalid-content', 'published tools require at least one substantive common pitfall.');
      }
      if (!Array.isArray(tool.faq) || tool.faq.length === 0 || tool.faq.some((item) => !item || !nonEmptyString(item.question) || !nonEmptyString(item.answer))) {
        issue('invalid-content', 'published tools require FAQ entries with a question and answer.');
      }
      if (!Array.isArray(tool.relatedSlugs) || tool.relatedSlugs.length === 0) {
        issue('invalid-related-link', 'published tools require at least one related guide or tool.');
      }
      const words = countUniqueProseWords(collectProse(tool));
      if (words < TOOL_MIN_WORDS) issue('tool-word-count', `published tool has ${words} unique explanatory words; at least ${TOOL_MIN_WORDS} are required.`);
    }
    if (candidate.kind === 'experience' && candidate.status === 'published') {
      const experience = candidate as ExperienceItem;
      const documentation = experience.documentation;
      const editorial = experience.presentation === 'editorial-mini-site';
      const showcase = experience.presentation === 'showcase';
      if (experience.presentation !== undefined && experience.presentation !== 'editorial-mini-site'
        && experience.presentation !== 'interactive-demo' && experience.presentation !== 'showcase') {
        issue('invalid-content', 'Experience presentation must be interactive-demo, showcase, or editorial-mini-site.');
      }
      const sections = [
        ['Overview', documentation?.overview, 2, 80],
        ['Key Features', documentation?.keyFeatures, 3, 40],
        ...(!editorial && !showcase ? [['How the Demo Works', documentation?.howDemoWorks, 2, 80] as const] : []),
        ['Platform & Availability', documentation?.platformAndAvailability, 2, 80],
      ] as const;
      for (const [name, items, minimumCount, minimumLength] of sections) {
        if (!Array.isArray(items) || items.length < minimumCount
          || items.some((item) => !nonEmptyString(item) || item.trim().length < minimumLength)) {
          issue('invalid-content', `published experiences require at least ${minimumCount} substantive ${name} items.`);
        }
      }
      if (editorial) {
        if (!nonEmptyString(documentation?.directAnswer) || documentation.directAnswer.trim().length < 80) {
          issue('invalid-content', 'editorial Experience pages require a substantive direct-answer block.');
        }
        if (!Array.isArray(documentation?.workflows) || documentation.workflows.length < 2
          || documentation.workflows.some((workflow) => !workflow || !nonEmptyString(workflow.title)
            || !nonEmptyString(workflow.summary) || workflow.summary.trim().length < 60
            || !Array.isArray(workflow.steps) || workflow.steps.length < 3
            || workflow.steps.some((step: unknown) => !nonEmptyString(step)))) {
          issue('invalid-content', 'editorial Experience pages require at least two substantive workflows with three steps each.');
        }
        if (!Array.isArray(documentation?.useCases) || documentation.useCases.length < 3
          || documentation.useCases.some((useCase) => !useCase || !nonEmptyString(useCase.title)
            || !nonEmptyString(useCase.description) || useCase.description.trim().length < 50)) {
          issue('invalid-content', 'editorial Experience pages require at least three substantive use cases.');
        }
        if (!Array.isArray(documentation?.evaluationQuestions) || documentation.evaluationQuestions.length < 3
          || documentation.evaluationQuestions.some((question) => !nonEmptyString(question) || question.trim().length < 35)) {
          issue('invalid-content', 'editorial Experience pages require at least three product-evaluation questions.');
        }
        if (!isValidProductWebsiteUrl(experience.productWebsiteUrl)) {
          issue('invalid-content', 'editorial Experience pages require a direct HTTPS official NoCharge product website URL.');
        }
        if (experience.googlePlayUrl !== undefined || experience.itchIoUrl !== undefined) {
          issue('invalid-content', 'editorial Experience pages cannot link to app stores or third-party projects.');
        }
        if (experience.appLegalSlug !== experience.slug || experience.appLegalSlug !== 'profivue' && experience.appLegalSlug !== 'rideside') {
          issue('invalid-content', 'editorial Android app overviews require their matching app-specific legal route.');
        }
        if (!Array.isArray(documentation?.artwork) || documentation.artwork.length < 1
          || documentation.artwork.some((artwork) => !artwork || !nonEmptyString(artwork.manifestAssetId)
            || !nonEmptyString(artwork.runtimeManifestAssetId) || !nonEmptyString(artwork.src)
            || !Number.isInteger(artwork.width) || artwork.width < 1
            || !Number.isInteger(artwork.height) || artwork.height < 1
            || !nonEmptyString(artwork.alt) || artwork.alt.trim().length < 50
            || !nonEmptyString(artwork.caption) || artwork.caption.trim().length < 30)) {
          issue('invalid-content', 'editorial Experience pages require locally registered artwork with dimensions, descriptive alt text, and captions.');
        }
      }
      if (showcase) {
        if (experience.moduleId || experience.moduleLoader || experience.instructions || experience.controls) {
          issue('invalid-content', 'Static showcase Experiences cannot declare an interactive module, instructions, or controls.');
        }
        const approvedTrailerId = experience.slug === 'coosjoint' ? 'bNMkbd4iv-g'
          : experience.slug === 'twosecondwitness' ? 'tOFySpe6yt0' : undefined;
        if (approvedTrailerId && (!Array.isArray(experience.youtubeTrailers) || experience.youtubeTrailers.length !== 1
          || experience.youtubeTrailers[0]?.videoId !== approvedTrailerId
          || !nonEmptyString(experience.youtubeTrailers[0]?.title))) {
          issue('invalid-content', 'Coo’s Joint and The 2-Second Witness require only their approved click-to-load official trailer.');
        }
        if (!approvedTrailerId && experience.youtubeTrailers !== undefined) {
          issue('invalid-content', 'Only Coo’s Joint and The 2-Second Witness may publish a YouTube trailer.');
        }
        if (experience.slug === 'barn-road-chronicles') {
          if (!experience.h5GamesAdsCandidate || experience.googlePlayUrl || experience.productWebsiteUrl || experience.appLegalSlug) {
            issue('invalid-content', 'Barn Road Chronicles must remain an itch.io-only future H5 Games Ads candidate.');
          }
        } else if (experience.appLegalSlug !== experience.slug || !isValidGooglePlayUrl(experience.googlePlayUrl)) {
          issue('invalid-content', 'Android app showcases require their matching app-specific legal route and a verified Google Play URL.');
        }
      }
      if (!documentation || !Array.isArray(documentation.faq) || documentation.faq.length < 3
        || documentation.faq.some((item) => !item || !nonEmptyString(item.question) || item.question.trim().length < 15
          || !nonEmptyString(item.answer) || item.answer.trim().length < 60)) {
        issue('invalid-content', 'published experiences require at least three substantive FAQ answers.');
      }
      if (!Array.isArray(experience.relatedSlugs) || experience.relatedSlugs.length === 0) {
        issue('invalid-related-link', 'published experiences require related published entries.');
      }
      if (experience.productWebsiteUrl !== undefined && !isValidProductWebsiteUrl(experience.productWebsiteUrl)) {
        issue('invalid-content', 'experience productWebsiteUrl must be a direct HTTPS NoCharge product host.');
      }
      if (experience.googlePlayUrl !== undefined && !isValidGooglePlayUrl(experience.googlePlayUrl)) {
        issue('invalid-content', 'experience googlePlayUrl must be a direct verified Google Play app-details URL.');
      }
      if (experience.itchIoUrl !== undefined && !isValidItchIoUrl(experience.itchIoUrl)) {
        issue('invalid-content', 'experience itchIoUrl must be a verified project page on the ITTYBITTYBITES creator host.');
      }
      if (experience.slug === 'coosjoint') {
        if (!isValidCooJointFacebookUrl(experience.facebookUrl)) {
          issue('invalid-content', 'Coo’s Joint requires its verified direct Facebook profile URL.');
        }
      } else if (experience.facebookUrl !== undefined) {
        issue('invalid-content', 'Only Coo’s Joint may publish its verified direct Facebook profile URL.');
      }
      const words = countUniqueProseWords(collectProse(experience));
      if (words < EXPERIENCE_MIN_WORDS) issue('experience-word-count', `published experience has ${words} unique explanatory words; at least ${EXPERIENCE_MIN_WORDS} are required.`);
    }
  } else if (candidate.kind === 'guide') {
    const guide = candidate as GuideArticle;
    if (candidate.status === 'published' && (!Array.isArray(guide.sections) || guide.sections.length < 4)) {
      issue('invalid-content', 'published guides require at least four structured sections.');
    }
    if (!Array.isArray(guide.sections)) {
      if (candidate.status === 'published') issue('invalid-content', 'published guides require structured sections.');
    } else {
      const headings = new Set<string>();
      for (const sectionValue of guide.sections as readonly unknown[]) {
        if (!sectionValue || typeof sectionValue !== 'object') {
          if (candidate.status === 'published') issue('invalid-content', 'guide sections must be objects with a heading and substantive paragraphs.');
          continue;
        }
        const section = sectionValue as { heading?: unknown; paragraphs?: unknown; steps?: unknown };
        const heading = nonEmptyString(section.heading) ? section.heading : 'Untitled';
        const normalizedHeading = heading.trim().toLocaleLowerCase();
        if (candidate.status === 'published') {
          if (!nonEmptyString(section.heading) || !Array.isArray(section.paragraphs) || section.paragraphs.length === 0
            || section.paragraphs.some((paragraph: unknown) => !nonEmptyString(paragraph) || paragraph.trim().length < 80)) {
            issue('invalid-content', `guide section “${heading}” requires a heading and substantive paragraphs.`);
          }
          if (headings.has(normalizedHeading)) issue('invalid-content', `guide heading “${heading}” is duplicated.`);
          headings.add(normalizedHeading);
          if (section.steps !== undefined && (!Array.isArray(section.steps) || section.steps.some((step: unknown) => !nonEmptyString(step)))) {
            issue('invalid-content', `guide section “${heading}” has an invalid steps list.`);
          }
        }
      }
    }
    if (candidate.status === 'published') {
      if (!Array.isArray(guide.relatedSlugs) || guide.relatedSlugs.length === 0) {
        issue('invalid-related-link', 'published guides require at least one related guide or tool.');
      }
      const words = countUniqueProseWords(collectProse(guide));
      if (words < GUIDE_MIN_WORDS) issue('guide-word-count', `published guide has ${words} unique explanatory words; at least ${GUIDE_MIN_WORDS} are required.`);
    }
  } else {
    issue('invalid-kind', `unknown content kind ${String((candidate as { kind?: unknown }).kind)}.`);
  }

  if (candidate.status === 'published') {
    const matched = collectPublicText(candidate as CatalogEntry).find((value) => PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value)));
    if (matched) issue('placeholder-content', 'published content contains a placeholder phrase.');
  }

  return issues;
}

export function validateContentRegistry(entries: readonly CatalogEntry[]): RegistryIssue[] {
  const issues = entries.flatMap(validateOne);
  const ids = new Map<string, CatalogEntry>();
  const slugs = new Map<string, CatalogEntry>();
  const publishedSeoTitles = new Map<string, CatalogEntry>();
  const publishedSeoDescriptions = new Map<string, CatalogEntry>();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const normalizedId = nonEmptyString(entry.id) ? entry.id.trim().toLocaleLowerCase() : '';
    const normalizedSlug = nonEmptyString(entry.slug) ? entry.slug.trim().toLocaleLowerCase() : '';
    if (normalizedId && ids.has(normalizedId)) {
      issues.push({ code: 'duplicate-id', message: `duplicate content id “${entry.id}”.`, entryId: entry.id, slug: entry.slug });
    } else if (normalizedId) ids.set(normalizedId, entry);
    if (normalizedSlug && slugs.has(normalizedSlug)) {
      issues.push({ code: 'duplicate-slug', message: `duplicate slug “${entry.slug}”; slugs must be globally unique.`, entryId: entry.id, slug: entry.slug });
    } else if (normalizedSlug) slugs.set(normalizedSlug, entry);

    if (entry.status !== 'published' || !entry.seo) continue;
    const normalizedTitle = nonEmptyString(entry.seo.title)
      ? entry.seo.title.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase()
      : '';
    const normalizedDescription = nonEmptyString(entry.seo.description)
      ? entry.seo.description.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase()
      : '';
    if (normalizedTitle && publishedSeoTitles.has(normalizedTitle)) {
      issues.push({ code: 'duplicate-seo-title', message: `duplicate published SEO title “${entry.seo.title}”.`, entryId: entry.id, slug: entry.slug });
    } else if (normalizedTitle) publishedSeoTitles.set(normalizedTitle, entry);
    if (normalizedDescription && publishedSeoDescriptions.has(normalizedDescription)) {
      issues.push({ code: 'duplicate-seo-description', message: `duplicate published SEO description for “${entry.slug}”.`, entryId: entry.id, slug: entry.slug });
    } else if (normalizedDescription) publishedSeoDescriptions.set(normalizedDescription, entry);
  }

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || !Array.isArray(entry.relatedSlugs)) continue;
    for (const relatedSlug of entry.relatedSlugs) {
      if (!nonEmptyString(relatedSlug)) continue;
      const target = slugs.get(relatedSlug.trim().toLocaleLowerCase());
      if (!target) {
        issues.push({ code: 'invalid-related-link', message: `related slug “${relatedSlug}” does not resolve to a registry entry.`, entryId: entry.id, slug: entry.slug });
        continue;
      }
      if (entry.status === 'published' && target.status !== 'published') {
        issues.push({ code: 'invalid-related-link', message: `published entry “${entry.slug}” cannot link to unpublished content “${relatedSlug}”.`, entryId: entry.id, slug: entry.slug });
      }
      if (entry.status === 'published' && (entry.kind === 'tool' || entry.kind === 'guide' || entry.kind === 'arcade')
        && target.kind !== 'tool' && target.kind !== 'guide') {
        issues.push({ code: 'invalid-related-link', message: `published ${entry.kind} “${entry.slug}” may relate only to published tools or guides.`, entryId: entry.id, slug: entry.slug });
      }
      if (nonEmptyString(entry.slug) && entry.slug.toLocaleLowerCase() === relatedSlug.trim().toLocaleLowerCase()) {
        issues.push({ code: 'invalid-related-link', message: `entry “${entry.slug}” cannot link to itself.`, entryId: entry.id, slug: entry.slug });
      }
    }
  }
  return issues;
}

export function assertValidContentRegistry(entries: readonly CatalogEntry[] = contentRegistry): void {
  const issues = validateContentRegistry(entries);
  if (issues.length > 0) {
    throw new Error(`Invalid NoCharge content registry:\n${issues.map((item) => `- ${item.code}: ${item.message}`).join('\n')}`);
  }
}

assertValidContentRegistry(contentRegistry);

export function getPublishedEntries(entries: readonly CatalogEntry[] = contentRegistry): PublishedCatalogEntry[] {
  // Fail closed at selector boundaries as well as module initialization: a caller
  // cannot accidentally turn an invalid published record into a public route.
  assertValidContentRegistry(entries);
  return entries.filter((entry): entry is PublishedCatalogEntry => entry.status === 'published');
}

export function getPublishedBySection(section: ContentSection, entries: readonly CatalogEntry[] = contentRegistry): PublishedCatalogEntry[] {
  return getPublishedEntries(entries).filter((entry) => entry.section === section);
}

export function getPublishedBySlug(
  section: ContentSection,
  slug: string,
  entries: readonly CatalogEntry[] = contentRegistry,
): PublishedCatalogEntry | undefined {
  const normalizedSlug = slug.trim().toLocaleLowerCase();
  return getPublishedBySection(section, entries).find((entry) => entry.slug === normalizedSlug);
}

export function getFeaturedEntries(
  section?: ContentSection,
  entries: readonly CatalogEntry[] = contentRegistry,
): PublishedCatalogEntry[] {
  return getPublishedEntries(entries)
    .filter((entry) => entry.featured && (!section || entry.section === section))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title));
}

export function getRelatedEntries(
  entry: PublishedCatalogEntry,
  limit = 3,
  entries: readonly CatalogEntry[] = contentRegistry,
): PublishedCatalogEntry[] {
  if (limit <= 0) return [];
  if (entry.kind === 'tool' || entry.kind === 'guide' || entry.kind === 'experience' && entry.relatedSlugs.length > 0) {
    const publishedBySlug = new Map(getPublishedEntries(entries).map((candidate) => [candidate.slug, candidate]));
    return entry.relatedSlugs
      .map((slug) => publishedBySlug.get(slug))
      .filter((candidate): candidate is PublishedCatalogEntry => candidate !== undefined && candidate.id !== entry.id)
      .slice(0, limit);
  }
  const targetTags = new Set(entry.tags.map((tag) => tag.toLocaleLowerCase()));
  return getPublishedEntries(entries)
    .filter((candidate) => candidate.id !== entry.id && candidate.slug !== entry.slug)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => targetTags.has(tag.toLocaleLowerCase())).length;
      const score = sharedTags * 4 + (candidate.category === entry.category ? 2 : 0) + (candidate.section === entry.section ? 1 : 0) + (candidate.featured ? 0.5 : 0);
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score
      || right.candidate.updatedAt.localeCompare(left.candidate.updatedAt)
      || left.candidate.title.localeCompare(right.candidate.title))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export interface ContentFacets {
  sections: ReadonlyArray<{ id: ContentSection; label: string; count: number }>;
  categories: string[];
  tags: string[];
}

export function getFacets(entries: readonly CatalogEntry[] = contentRegistry): ContentFacets {
  const published = getPublishedEntries(entries);
  return {
    sections: CONTENT_SECTIONS.map((section) => ({
      id: section.id,
      label: section.title,
      count: published.filter((entry) => entry.section === section.id).length,
    })).filter((section) => section.count > 0),
    categories: [...new Set(published.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b)),
    tags: [...new Set(published.flatMap((entry) => [...entry.tags]))].sort((a, b) => a.localeCompare(b)),
  };
}

export { getContentPath, getSectionDefinition } from './sections';

export function getPublishedContentRoutePaths(entries: readonly CatalogEntry[] = contentRegistry): string[] {
  return getPublishedEntries(entries).map(getContentPath);
}

export const publishedContent = getPublishedEntries();
export const contentRouteCounts = {
  arcade: getPublishedBySection('arcade').length,
  experiences: getPublishedBySection('experiences').length,
  tools: getPublishedBySection('tools').length,
  guides: getPublishedBySection('guides').length,
} as const;
