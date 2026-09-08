---
title: Last Token
tagline: Two players, one device.
description: Play Last Token with a friend on one screen. Take 1–3 tokens from one pile each turn — whoever takes the last token loses. Quick rounds, no account, no timer.
emoji: 🪙
accent: "#fb923c"
tier: quick
runtime: last-token
artwork:
  icon: /game-art/last-token/icon.svg
  coverSquare: /game-art/last-token/cover-square.webp
  coverSquareFallback: /game-art/last-token/cover-square.jpg
  coverLandscape: /game-art/last-token/cover-landscape.webp
  coverLandscapeFallback: /game-art/last-token/cover-landscape.jpg
  guideHeader: /game-art/last-token/guide-header.webp
  guideHeaderFallback: /game-art/last-token/guide-header.jpg
  socialCard: /game-art/last-token/social-card.jpg
  socialCardFallback: /game-art/last-token/social-card.jpg
  socialCardWebp: /game-art/last-token/social-card.webp
  alt: Three orange token piles on a dark table, one pile already partly taken
presentation:
  controlsHeading: Take tokens, don't take the last one.
  controls:
    - label: Take tokens
      description: Each pile lists the takes its size allows — Take 1, Take 2, or Take 3 — by touch, pointer, or arrow keys plus Enter.
    - label: One pile per turn
      description: A turn removes one to three tokens from a single pile; you cannot split a turn across piles.
    - label: Losing
      description: The player who takes the very last token of the round loses, so watch what you leave behind.
    - label: Rounds
      description: Rounds are quick and the player who opens alternates each round. Presets include 3-4-5, 1-3-5-7, and the quick 3-5.
  relatedHeading: Try another shared screen.
genre: Pass & Play
difficulty: Easy to learn
session: 1–2 min per round
order: 9
---

Last Token is a take-away game in which removing the last piece is the losing move. It is played by two people taking turns on the same device, with no hidden information.

## Objective and win/loss conditions

Leave your opponent to take the final token. A round ends as soon as every pile is empty, and the player who made that last take loses. Choose piles of 3–4–5, 1–3–5–7, or 3–5; the opening player alternates each round. There is no timer or draw from running out of turns.

## How it plays

On a turn, remove one, two, or three tokens from exactly one pile. You cannot split a take between piles, take zero, or remove more than that pile holds. The available Take buttons show which choices are legal, and the handoff follows a completed take.

For example, if the only remaining pile has four tokens, take three and leave one. Your opponent then has no choice but to take the last token and lose. If just one token is left at the start of your turn, taking it is mandatory; there is no pass button to avoid the result.

## Scoring and strategy

The result is one winner per round, not points for the number of tokens removed. Large takes are not automatically good: compare the position you leave rather than the amount you clear.

When every remaining pile contains one token, each turn removes one entire pile. An odd number of such piles leaves the player to move taking the last token under forced play; an even number leaves that task to the opponent. Earlier positions with larger piles need separate analysis because one turn can remove several tokens from a single pile.

## Local save data

`nocharge:passplay:match:last-token` stores the last preset, winning player slot, 1–0 or 0–1 outcome tally, and finish date. The remaining piles and earlier rounds are not saved. This is a single localStorage result without names, an account, or a public ranking.
