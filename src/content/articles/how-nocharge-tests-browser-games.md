---
title: "How NoCharge tests browser games"
kind: platform
category: testing
description: "A transparent guide to NoCharge’s rule tests, Chromium browser gate, axe scans, consent checks, validators, and still-manual release checks."
published: "2026-08-19"
updated: "2026-08-19"
author: "NoCharge"
reviewer: "NoCharge"
readTime: 6
topics: ["testing", "accessibility", "quality"]
featured: true
draft: false
---

A browser game can build successfully and still have a broken rule, inaccessible control, stale guide, or privacy regression. NoCharge tests those layers separately and keeps the remaining manual work visible.

## Rules before rendering

Pure unit tests cover logic that does not need a browser: Color Flip checkpoint and selection rules, Beacon Lattice patterns, puzzle quality and progress, shared pause recovery, local discovery ordering, collection qualification, and technical error-reporting boundaries. These tests make edge cases repeatable without depending on animation timing.

They do not replace an actual mounted game. The required browser gate builds the static Astro site and runs Playwright in Chromium. It exercises every current game, keyboard actions, restart, shared mute, full-screen/immersive behavior, pause and resume, hidden-tab return, content routes, and privacy clearing.

## Accessibility and responsive checks

Axe scans run against representative public pages, each game, guides, articles, collections, and trust pages. Browser tests check headings, breadcrumbs, accessible names, focus behavior, keyboard operation, and mobile layouts. Mobile-sized Chromium viewports expose reflow and touch-target problems, but an emulated viewport is not the same as a physical touch device.

Automated checks cannot prove perfect accessibility. Screen-reader usefulness, Windows High Contrast, physical touch behavior, 200% zoom judgment, and device/browser combinations still require an owner to perform and record manual checks.

## Consent and advertising boundaries

Consent-network tests intercept third-party requests so they can confirm that optional analytics stays blocked before consent and can be disabled again. Browser tests stub Google endpoints; they do not depend on a live ad or CMP response and never click an advertisement. Other tests verify the exact AdSense publisher/slot attributes, one bottom placement, ad-free trust routes, spacing below gameplay, the public `ads.txt`, and the narrow CSP origin list.

A passing stubbed test confirms NoCharge’s integration boundary, not Google’s live service availability.

## Content and release validators

The build validates typed content metadata. Additional commands inspect generated HTML, internal links, sitemap routes, JSON-LD, and asset budgets. Artwork tests check required files and dimensions. Mounted-game capture tooling is used when a gameplay screenshot must be refreshed; generated decorative art is not presented as a live-game screenshot.

The sitemap and structured-data checks make sure platform articles and curated collections are discoverable with accurate canonicals, breadcrumbs, Article, CollectionPage, and ItemList data. Content review still has to compare prose with runtime code—the compiler cannot decide whether an explanation of a move is honest.

## Required and manual gates

Chromium is the required pull-request and deployment browser gate. Firefox, WebKit, Mobile Chromium, and Mobile WebKit are configured as an extended matrix run manually for major releases and shared lifecycle changes. Lighthouse is also a manual release check. Neither Firefox/WebKit nor Lighthouse should be described as continuously passing unless a current run has been recorded.

Manual device testing remains required after automation, especially for game input, assistive technology, zoom, reduced motion, consent layering, and visual ad separation. The repository’s [Accessibility Statement](/accessibility/) and manual checklist distinguish automated checks from completed and still-required owner checks.

For a visitor, the useful next step is to report a reproducible barrier or rule mismatch to [hello@nocharge.net](mailto:hello@nocharge.net). For a release owner, it is to run the documented command set, record the manual matrix, and treat a green suite as evidence—not as a promise that no defect exists.
