# Production uptime workflow handoff

`node scripts/check-production.mjs` performs privacy-safe synthetic checks only. It requests public routes, `/health.json`, and `/sitemap.xml`; it does not send player data, cookies, form values, local storage, or analytics events. By default it checks `https://nocharge.net`. Set `NOCHARGE_PRODUCTION_URL` to validate another deployed origin and `NOCHARGE_RESPONSE_THRESHOLD_MS` to adjust the response-time budget.

Scheduled production monitoring is **not active** until the owner creates a GitHub Actions workflow (or configures another monitor). Copy this workflow into `.github/workflows/production-uptime.yml`:

```yaml
name: Production uptime

on:
  schedule:
    - cron: "*/15 * * * *"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  uptime:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: node scripts/check-production.mjs
```

The workflow deliberately has no production credentials. Configure alerts, incident ownership, and any external status page separately if desired; do not state that external monitoring is active until that configuration exists and is verified.
