# NoCharge V2

The React + Vite + TypeScript static site for nocharge.net. Production builds pre-render the public routes and generate a sitemap and GitHub Pages 404 page. Analytics and advertising integrations are inactive by default.

## Run locally

```sh
npm install
npm run dev
```

The development server binds to `0.0.0.0` for the workspace live preview. `npm run build` type-checks, bundles the client, and statically renders the public routes. `npm test` runs the project verification suites.

### Windows one-click setup

Install Node.js 24 LTS once, extract the workspace, and double-click [`Start-NoCharge.bat`](./Start-NoCharge.bat). It installs packages on first use, starts the local server, and opens the site in your browser. See [WINDOWS-SETUP.md](./WINDOWS-SETUP.md) for the exact Windows download and troubleshooting steps.

## Routes

- `/` — Home
- `/arcade/` — Arcade
- `/experiences/` — App Experiences, with ITTYBITTYBITES product websites and in-browser experiences
- `/tools/` — Tools
- `/guides/` — Guides
- `/discover/` — Discover
- `/shop/` — Shop directory
- `/shop/:brandSlug/` — gated individual brand/store landing page; only complete, published records are built
- `/arcade/:slug/` and `/arcade/categories/:slug/` — gated game and game-category templates
- `/experiences/:slug/` — gated app-experience template
- `/tools/:slug/` — gated tool template
- `/guides/:slug/` — gated article template
- `/discover/collections/:slug/` — gated collection template
- `/about/` — About
- `/contact/` — Contact scaffold
- `/privacy/` — Privacy scaffold; legal review required
- `/terms/` — Terms scaffold; legal review required
- `404.html` — GitHub Pages not-found page

All public pages have page-specific titles and descriptions, canonical/OG metadata, and robots directives. The homepage is indexable; empty destination/support pages and the 404 page are `noindex`. The generated sitemap lists only indexable pages. The homepage has minimal WebSite JSON-LD; no content schema is emitted for empty pages.

## Static output and GitHub Pages

The production build writes `dist/index.html`, route-specific `dist/<route>/index.html` documents, `dist/404.html`, `dist/robots.txt`, a generated `dist/sitemap.xml`, and GitHub Pages’ `.nojekyll` marker. The route HTML contains server-rendered page content before client hydration; JavaScript is not required to see page copy or navigation.

`SITE_URL` in `src/site.ts` is set to `https://nocharge.net` for canonical URLs and the sitemap. Vite uses `/` by default, which is correct for a custom/root domain. For a GitHub Pages project path, set `VITE_BASE_PATH=/repository-name/` at build time; client routing and pre-rendered links use that base. GitHub Pages builds and deploys `dist/` from `main`; the custom domain is retained in `public/CNAME`.

## Content templates and publishing gate

`src/templates/ContentTemplates.tsx` contains reusable templates for game details, game categories, app experiences, individual tools, guides/articles, collections, and brand storefronts. Published Arcade, Experience, Tool, and Guide records are typed and publication-gated in `src/content/registry.ts`; only published, validated records produce public detail routes and sitemap entries. ITTYBITTYBITES external app websites use their separate product directory and do not alter those content records.

## Shop and independent storefronts

`/shop/` is a central directory scaffold. `src/integrations/storefronts.ts` is the per-brand configuration point: each future entry has its own internal slug, Square Online destination URL, optional NoCharge subdomain alias (for example `witness.nocharge.net` or `coos.nocharge.net`), publication status, and SEO metadata. The registry is empty. Published brand landing pages are pre-rendered only when required metadata and real introductory copy are present. The `nochargeSubdomain` field is an architectural placeholder only; no domain or DNS is configured.

Square Online is expected to own products, inventory, cart, checkout, payments, and orders. NoCharge only prepares the outbound-link seam. Outbound clicks are typed in `src/integrations/analytics.ts`; analytics currently has no adapter and sends nothing. Privacy and Terms scaffolds explicitly require finalized language about independently operated external storefronts before launch.

## ITTYBITTYBITES application directory

`/experiences/` has two independent kinds of destinations: published in-browser ExperienceItems remain in `src/content/registry.ts` with their existing local detail routes, while dedicated ITTYBITTYBITES product websites are configured separately in `src/content/experienceProducts.ts`. The product directory groups apps under Games & Entertainment and Productivity & Utilities and links to `coosjoint.nocharge.net`, `twosecondwitness.nocharge.net`, `profivue.nocharge.net`, and `rideside.nocharge.net` using HTTPS. These are application sites—not Square Online storefronts—and are never added to `src/integrations/storefronts.ts`. The Shop route, storefront registry, and external-commerce boundary remain separate.

## Future integrations

- `src/integrations/analytics.ts` — typed no-op events for games, tools, app experiences, guides, app-store outbound clicks, and brand-specific Square Online outbound clicks.
- `src/integrations/advertising.ts` — disabled H5 Games Ads seam gated to explicitly eligible published games; other page types are ineligible.
- `src/search/index.ts` — empty search index and filter function; no fabricated searchable records.

No analytics, ads, Square connection, account system, backend, or database is active.

## Structure

```text
src/
  components/       shared navigation, search, brand, page primitives
  content/          publication-gated content registry and ITTYBITTYBITES product directory
  design-system/    brand tokens and visual identity primitives
  integrations/     analytics, H5 ads, independent storefront config
  layouts/          shared site shell
  pages/            home, destination, supporting, legal, and 404 pages
  search/           empty search index and query helper
  seo/              client metadata synchronization
  templates/        reusable future content-page templates and types
  styles.css        global resets, component patterns, and responsive layouts
scripts/
  dev.mjs           timed Vite development-server startup
  prerender.mjs     static route HTML, sitemap, and 404 generation
  smoke-test.mjs    dependency-free build/output checks
```

## Performance and checks

The project uses React, React Router, Vite, and TypeScript without a component library or CSS framework. Run `npm test` for the project verification suites before deployment.
