# Lighthouse CI handoff

`npm run lighthouse` uses the production build in `dist`, starts Astro preview through Lighthouse CI, and seeds a denied optional-consent choice before page load. This keeps advertising and analytics optional requests out of the audit.

The repository workflow has been prepared with a Lighthouse step. If workflow edits cannot be pushed by the GitHub App or are intentionally managed by the owner, add this block after the production build and browser setup steps:

```yaml
- name: Run Lighthouse budgets with optional advertising denied
  run: npm run lighthouse
```

Lighthouse CI is not active merely because this configuration exists. Call it active only after the owner applies the workflow change and GitHub reports a passing Lighthouse job.
