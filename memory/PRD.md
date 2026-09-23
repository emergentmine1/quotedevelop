# KWE Instant Quote — PRD & Progress

## Original problem statement
Existing "KWE Instant Quote" app: Java Spring Boot backend (jOOQ + PostgreSQL/Aurora, runs elsewhere) + React 19 + Vite frontend. User requested:
1. Convert the FRONTEND from React+Vite to **Next.js App Router with SSR**, WITHOUT changing the UI (already demoed to management).
2. Keep ONLY the public **quote generation** and **quote result** pages in this repo; move all admin/auth/dashboard/provider code to a **separate repo** (`/app/kwe-admin`).
3. Remove the **Admin Login** button entirely (pure public quote tool).
4. Point the API client at the **real backend endpoints** via `NEXT_PUBLIC_BACKEND_URL`.
5. Results-page pricing is **DUMMY for now** (client-side pricing engine) — real rates API deferred.

## Architecture (current)
- **`/app/frontend`** — Next.js 15.5 (App Router, JS). Public app only.
  - Routes: `/` → redirect `/instant-quote`; `/instant-quote` (form); `/instant-quote/results` (results).
  - Views: `src/views/InstantQuote.jsx`, `src/views/InstantQuoteResults.jsx`, `src/views/NoRateFound.jsx`.
  - Scaffolding: `src/app/layout.js` (fonts, PostHog, DataClone guard), `src/app/providers.jsx` (react-query + sonner Toaster), `src/app/globals.css`.
  - Data/logic kept: `pricing-engine.js` + `pricing-data.js` (DUMMY rate source), `mock-data.js` (trimmed to ports/airports/providers), currency, quote-number, quote-pdf, quote-ui-config, city-zip-suggestions, utils, ui/*.
  - `src/lib/api-client.js` → real endpoints via `NEXT_PUBLIC_BACKEND_URL`.
  - Served by supervisor `[program:frontend]` → `yarn start` → `next dev -p 3000`.
- **`/app/kwe-admin`** — the FULL original Vite app (admin/auth/dashboard/provider/pricing). Separated for the user to push as its own GitHub repo. Untouched, still runs on Vite.
- **`/app/backend-java`** — Spring Boot service (reference only here; user runs it elsewhere).

## Real backend endpoints wired in api-client
- `GET /api/v1/profiledata/defaults`
- `GET /api/v1/masterdata/codes?cmcode=...`
- `GET /api/v1/masterdata/airports?query=&countryCode=&limit=`
- `GET /api/v1/masterdata/countries`
- `POST /api/v1/quote-requests` → `{ qrid, qrref, status }` (called best-effort on submit; non-blocking)

## What's been implemented (2026-06)
- ✅ Full Vite → Next.js 15 App Router migration; UI pixel-identical (verified desktop + mobile).
- ✅ react-router-dom → next/navigation + next/link across the two views.
- ✅ Admin Login button removed; auth/leads/localStorage mock removed from public app.
- ✅ Admin & everything else copied to `/app/kwe-admin`.
- ✅ api-client rewritten to real backend contract + `QuoteRequestPayload` mapper.
- ✅ Quote submit posts best-effort to `POST /api/v1/quote-requests`, then routes to results.
- ✅ E2E tested (testing agent iteration_1): 4-step flow → results → edit-search. Frontend 100%.
- ✅ (2026-06) Country flags served from **local files** (`public/flags/*.png`, 254 flags) instead of flagcdn — updated `Flag.jsx` in both `frontend/` and `kwe-admin/`.
- ✅ (2026-06) **Accurate quote-submit mapping**: `mapToQuoteRequestPayload` now resolves real cdcodes from the backend (`loadQuoteCodes()` → `/profiledata/defaults` + `/masterdata/codes?cmcode=PKT,ACS,PDT`): packageType→PKT cdcode, services→ACS cdcodes, door/port→PDT, mode/cargo/rating/uom from defaults. Units normalized to canonical KG/CM/CBM. Safe fallbacks when backend offline. Verified against schema `tx_quoterequest` / `tx_quoterequestdetails` (quote_dev.json).

## Notes / MOCKED
- **Results pricing is DUMMY** (client-side `pricing-engine.js`), per user request until a real rates API is decided.
- **Backend not reachable in preview**: `NEXT_PUBLIC_BACKEND_URL` is empty; the quote submit fails silently and the flow still proceeds. Set the env var to the deployed backend URL to activate it.
- Origin/destination dropdowns still use the local airport list (kept to preserve the exact demoed UI). Switching to live `/masterdata/airports` would require an async-search UI change.
- Payload mapper `mapToQuoteRequestPayload` uses cdcodes from ProfileData defaults; `packageType`→PKT cdcode and `accessorialServices`→ACS cdcodes are TODOs to confirm against `/masterdata/codes` once the live DB is reachable.

## Backlog / Next tasks
- P1: Wire `NEXT_PUBLIC_BACKEND_URL` to the live backend; verify submit end-to-end + CORS (add Next origin to `CorsConfig`).
- P1: Real rates/offers endpoint to replace dummy pricing on the results page.
- P2: Live `/masterdata/airports` async search + `/masterdata/countries` for dropdowns.
- P2: Confirm PKT/ACS cdcode mappings in the submit payload.
- P3: Optional refactor — split large `InstantQuote.jsx` into `components/instant-quote/*`.
