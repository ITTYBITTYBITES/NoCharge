# Lighthouse CI

Lighthouse no longer blocks every deployment. It remains available as a manual
check through `npm run lighthouse`, which uses the production build in `dist`,
starts Astro preview through Lighthouse CI, and seeds a denied analytics-consent
choice before page load. This keeps the optional analytics requests out of the
audit. The AdSense banner and Google consent tags are part of the audited
production build; advertising requests themselves are governed by Google's
consent message at runtime.

Run Lighthouse before major releases and after performance-sensitive changes:

```bash
npm run lighthouse
```

Lighthouse CI is not active in the required PR or deployment workflow. Treat the
reported performance, accessibility, best-practices, and SEO budgets as release
guidance rather than a merge requirement, and review any budget failures before
publishing.
