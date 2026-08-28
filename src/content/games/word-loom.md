---
title: "Word Loom"
tagline: "Weave the word. Six guesses, one date."
description: "An original five-letter word game with daily (date-seeded) and practice modes. Feedback uses symbols and color, the streak lives only on this device, and there is no account. Not affiliated with any third-party word puzzle."
emoji: "⌘"
accent: "#f97316"
tier: signature
runtime: word-loom
artwork:
  icon: /game-art/word-loom/icon.svg
  coverSquare: /game-art/word-loom/cover-square.webp
  coverSquareFallback: /game-art/word-loom/cover-square.jpg
  coverLandscape: /game-art/word-loom/cover-landscape.webp
  coverLandscapeFallback: /game-art/word-loom/cover-landscape.jpg
  guideHeader: /game-art/word-loom/guide-header.webp
  guideHeaderFallback: /game-art/word-loom/guide-header.jpg
  socialCard: /game-art/word-loom/social-card.jpg
  socialCardFallback: /game-art/word-loom/social-card.jpg
  socialCardWebp: /game-art/word-loom/social-card.webp
  alt: Five letter tiles with one highlighted in orange on a dark Quiet Arcade field
genre: Word
difficulty: Fixed word list
session: 2–5 min
featured: true
order: 25
presentation:
  controlsHeading: "Guess the five-letter word in six tries. ✓ correct · ~ present elsewhere · ✗ absent."
  controls:
    - label: Type
      description: Type five letters in the input and press Enter or Loom it. Only real words from the calm list are accepted.
    - label: Daily vs practice
      description: Daily uses the device-local date; practice picks a random word and never touches the streak.
    - label: Feedback
      description: Each tile shows a symbol and a color. Symbols and spoken labels are the non-color state.
    - label: Streak
      description: On-device only, stored under nocharge:daily:word-loom:streak. Missing a day restarts it.
---

Word Loom is NoCharge's original five-letter word game: six guesses, five letters, and feedback that is never color-only. Daily mode is seeded by the device-local date; practice mode is always available and never touches the streak. The rules and name are NoCharge's own — this is not a clone of any third-party word game.

## Quick answer

This game opens directly in the browser without an account. The streak and solved date stay in this browser's localStorage.

## How it plays

The board, controls, and session length are documented on the game page and in its definitive guide. No special hardware is required beyond what the guide lists. The game supports the inputs documented for that title.

## Controls at a glance

Check the game page for pointer, touch, and keyboard alternatives. Most actions have a keyboard path and a pointer path. Fullscreen or focus mode depends on browser permission and can be exited with Escape.

## Local storage and session

Best results, win counts, or puzzle progress are kept in this browser only. A different browser, profile, private window, or device will not share them. Clearing site data removes them. My Arcade reads these local values to show a private dashboard.

## Accessibility and options

Sound on/off and mute are separate preferences. Volume and ambient are local choices. Focus outlines remain visible and no board uses transform scale to force fit. Reduced motion affects animation, not sound.

## What NoCharge did not evaluate

This description is based on current game code and tests. We did not measure long-term durability, evaluate every screen reader combination, or promise compatibility with every device. The game is general-audience and not directed to children.

## Next step

Open the game, play one run with the controls documented, and check the guide for the full rule set if needed. Use Privacy page to clear local data when you want.
