# Production uptime workflow

The scheduled GitHub Actions workflow at `.github/workflows/production-uptime.yml` probes the public V2 site at `https://nocharge.net` every 15 minutes and can also be run manually. It checks the home page, primary V2 hubs, sitemap, robots file, and setup feed using read-only HTTP requests. It sends no player data, cookies, form values, local storage, or analytics events.

The workflow has no production credentials. Configure notifications, incident ownership, or an external status page separately if desired; do not state that alerts are active until that configuration is verified.
