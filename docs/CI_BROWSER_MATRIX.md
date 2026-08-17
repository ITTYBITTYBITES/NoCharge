# Browser matrix CI handoff

The repository includes Chromium, Firefox, WebKit, Mobile Chromium, and Mobile WebKit/iPhone Playwright projects. The default local `npm run test:e2e` remains Chromium-only for a faster edit loop. `npm run test:e2e:matrix` enables the full matrix with `cross-env` so the command is cross-platform.

The current repository workflow has been prepared to use the full browser install and matrix command. If a GitHub App or branch policy prevents workflow changes from being pushed, the owner should apply this exact replacement in the browser-test portion of the workflow:

```yaml
- name: Install browser test dependencies
  run: npx playwright install --with-deps chromium firefox webkit

- name: Run browser and accessibility tests
  run: npm run test:e2e:matrix
```

Firefox/WebKit CI should be described as active only after this workflow is present on GitHub and its checks have passed. Until then, matrix coverage is repository-side and can be run locally or in another approved CI environment.
