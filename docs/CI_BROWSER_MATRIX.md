# Browser matrix CI

## Required gate

Chromium is the required PR and deployment gate. On GitHub-hosted Ubuntu runners,
the `chromium` Playwright project uses the runner's preinstalled stable Google
Chrome channel. CI prints the resolved Chrome and Playwright versions, does not
download a Playwright browser, and runs against the production build already
created by the preceding build step:

```yaml
- name: Browser diagnostics
  run: |
    which google-chrome google-chrome-stable chromium chromium-browser || true
    google-chrome --version 2>/dev/null || google-chrome-stable --version 2>/dev/null || true
    npx playwright --version

- name: Run browser and accessibility tests
  run: npx playwright test --project=chromium
```

Local development continues to use Playwright's bundled Chromium after
`npx playwright install chromium`; `channel: 'chrome'` is CI-only. The complete
Chromium project is the required check before merge or production deployment.

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
