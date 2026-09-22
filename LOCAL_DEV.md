# Running KWE Instant Quote locally

The project now has three independent parts:

| Part | Path | Stack | Port |
|------|------|-------|------|
| Public quote app | `frontend/` | Next.js 15 (App Router, SSR) | 3000 |
| Admin app (separated) | `kwe-admin/` | React 19 + Vite | 3000 |
| Backend API | `backend-java/` | Spring Boot (Java 21) + PostgreSQL | 8080 |

Prerequisites: **Node.js >= 20**, **Yarn 1.x**, **JDK 21** (backend only), a reachable **PostgreSQL/Aurora** DB (backend only).

---

## 1. Backend (Java Spring Boot) — start this first
The backend needs a reachable PostgreSQL DB. jOOQ generates code from the live DB at build time, so the DB must be reachable even to compile.

```bash
cd backend-java
cp .env.example .env          # then fill in the DB values
# edit .env:
#   DB_HOST=your-db-host
#   DB_PORT=5432
#   DB_NAME=quoteamdev
#   DB_SCHEMA=quoteownr
#   DB_USER=...
#   DB_PASSWORD=...
#   SERVER_PORT=8080

# Spring reads these from the process environment, so export them:
export $(grep -v '^#' .env | xargs)

# Run (uses the bundled Maven wrapper — no global Maven needed):
./mvnw spring-boot:run
```

Verify:
- Liveness: `curl http://localhost:8080/ping`
- API docs (Swagger): http://localhost:8080/swagger-ui.html
- Key endpoints: `/api/v1/profiledata/defaults`, `/api/v1/masterdata/codes`, `/api/v1/masterdata/airports`, `/api/v1/masterdata/countries`, `POST /api/v1/quote-requests`

> No DB yet? The public frontend still runs — the quote submit just no-ops (best-effort). Pricing on the results page is client-side dummy data regardless.

---

## 2. Public quote app (Next.js) — the main deliverable
```bash
cd frontend

# point it at your backend (create/edit .env):
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8080" > .env

yarn install
yarn dev            # Next.js dev server with hot reload
# open http://localhost:3000  (redirects to /instant-quote)
```

Production build:
```bash
yarn build          # next build
yarn serve          # next start  (serves the optimized build on :3000)
```

Scripts (in `frontend/package.json`):
- `yarn dev` / `yarn start` → `next dev -p 3000`
- `yarn build` → `next build`
- `yarn serve` → `next start -p 3000`

CORS: the backend `CorsConfig` allows `http://localhost:*` by default, so localhost works out of the box. For a deployed frontend, add its origin to `kwe.cors.allowed-origin-patterns`.

---

## 3. Admin app (Vite) — optional, separate repo
This is the full original app (login/dashboard/provider/admin pricing). It also defaults to port 3000, so run it on a different port if the Next app is running.

```bash
cd kwe-admin
yarn install
yarn start -- --port 3001      # or edit the "start" script
# open http://localhost:3001
```
It reads the backend URL from `VITE_BACKEND_URL` (create a `.env` with `VITE_BACKEND_URL=http://localhost:8080` if needed).

---

## Notes
- `frontend/` and `kwe-admin/` both use port 3000 by default — don't run both on the same port.
- `NEXT_PUBLIC_*` env vars are inlined at build time; restart `yarn dev` after changing `.env`.
- The `docker-compose.yml` at the repo root predates this migration — its `frontend` service/Dockerfile/nginx.conf still target the OLD Vite build and would need updating before using Docker for the Next.js app. Running the three parts directly (as above) is the supported path today.
