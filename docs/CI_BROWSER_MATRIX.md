# Browser matrix CI

## Required gate

Chromium is the required PR and deployment gate. The committed workflow installs
Chromium only and runs the Chromium Playwright project:

```yaml
- name: Install browser test dependencies
  run: npx playwright install --with-deps chromium

- name: Run browser and accessibility tests
  run: npm run test:e2e
```

`npm run test:e2e` runs the Chromium project. This is the fast check that must
pass before a PR merges or a production deployment publishes.

## Extended compatibility checks

Firefox, WebKit, Mobile Chromium, and Mobile WebKit are extended compatibility
checks. They are configured as additional Playwright projects that are only
enabled when `FULL_BROWSER_MATRIX=1` is set.

Run the full matrix manually before major releases and after substantial changes
to shared game lifecycle, input, fullscreen, consent, or responsive gameplay:

```bash
npm run test:e2e:matrix
```

Do not describe extended compatibility as current unless the latest manual run
passed. Record the date and result of each manual matrix run alongside the
release it covered.
