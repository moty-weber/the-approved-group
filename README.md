# The Approved Group — website v2

Public website + **case manager** (family-tree projects, documents per person, country rules, GEDCOM import/export).

- Frontend: React 18 + Vite (`src/`), public pages in `src/public`, case manager in `src/app`, shared logic in `src/lib`.
- Backend: Cloudflare Pages Functions (`functions/api/[[path]].js`) with a D1 database (`schema.sql`). Documents are stored in D1 in ~1.9 MB chunks (max 25 MB per file).
- The original static pages are kept unchanged in `legacy/` for reference. Old URLs (`/about.html` …) redirect to the new pages (`public/_redirects`).

## Run / deploy
```
npm install
npm test            # unit tests for dates, Hebrew calendar, places, tree logic, GEDCOM
npm run build       # → dist/
npx wrangler pages deploy dist --project-name approved-eu --branch main
```
Database: `npx wrangler d1 execute approved-eu-db --remote --file schema.sql` (first time only).

## Important
This version needs a server (Cloudflare Pages + D1). **GitHub Pages cannot run it** — do not merge into `main` while approvedeu.com is served by GitHub Pages. To go live, point approvedeu.com at the Cloudflare Pages project `approved-eu` (Custom domains) and switch GitHub Pages off.

Country rules (`src/lib/rules.js`) and the historical-borders table (`src/lib/places.js`) are general guidance, not legal advice.
