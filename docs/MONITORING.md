# Privacy-aware error reporting and monitoring

## Client error reporting

NoCharge does not load a new error-monitoring vendor. Instead, a small browser module listens for `error` and `unhandledrejection` events and can send a consented GA `exception` event only after Analytics consent has been granted.

The module:

- does nothing before Analytics consent and does nothing when `gtag` is unavailable;
- never loads Google Analytics itself; the existing consented analytics path owns that integration;
- sends a controlled error category rather than raw error text, so user-entered text is not sent;
- strips query strings and fragments during sanitization and sends a route template such as `/games/[slug]/`, never a full current URL;
- keeps any temporary rate-limit fingerprint in memory only, never in local storage or IndexedDB;
- does not read local storage, IndexedDB, game selections, Word Tile Rush words, card selections, game paths, DOM content, form values, or keystrokes;
- limits stack output to short same-origin file lines when a browser provides them;
- truncates candidate messages and stack lines before use, rate-limits repeated errors, and prevents reporting failures from recursively reporting themselves; and
- includes the public release identifier rendered into the document.

There is no session replay, DOM recording, fingerprinting, form capture, or keystroke capture.

## Health and uptime preparation

`/health.json` is a static build-time endpoint. It contains only `status`, `site`, `release`, and `builtAt`; it contains no host, secrets, visitor, or personal data.

The synthetic uptime script and scheduled-workflow handoff are documented in [CI_UPTIME.md](./CI_UPTIME.md). Scheduled or external uptime monitoring should not be claimed as active until the owner installs and verifies it.
