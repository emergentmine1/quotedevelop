# KWE Instant Quote Admin

```
/app
├── admin-ui/            React 19 + Vite admin app (Rate Management, Customer Leads, login/roles)
├── backend-java/        Spring Boot 3.5 + jOOQ API (see backend-java/AUTH_SETUP.md)
├── docker-compose.yml   runs both
└── .env.example         values for docker compose
```

## Admin UI only, dummy data (no backend)

Needs Node.js 20+ and Yarn.

```bash
cd admin-ui
yarn install
yarn start            # http://localhost:3000
```

No `.env` needed: sign-in runs in demo mode and data is kept in the browser.
**Sign in with SSO** → email → **Next** → password `Demo@123`.

| Email | Access |
|---|---|
| writer@kwe.com | Read + Write — Pricing Matrix, Customer Leads, Quotes |
| reader@kwe.com | Read-Only — Customer Leads, Quotes |
| inactive@kwe.com | Denied (inactive) |
| outsider@kwe.com | Denied (no record) |

## With the Java backend (local, no Docker)

1. Run `backend-java/db/*.sql` against your database (before the first build — jOOQ reads these tables).
2. Backend: set the DB / auth env vars (see `backend-java/.env.example`), then
   `cd backend-java && ./mvnw spring-boot:run` → http://localhost:8080
3. UI: create `admin-ui/.env` with `VITE_BACKEND_URL=http://localhost:8080` and `VITE_AUTH_MODE=static`, then `yarn start`.

## With Docker

```bash
cp .env.example .env                                   # fill in DB values
cd backend-java && ./mvnw clean package -DskipTests && cd ..   # jar needs DB access for jOOQ codegen
docker compose up --build                               # UI :3000, backend :8080
```

UI only with dummy data: set `VITE_AUTH_MODE=demo` in `.env`, then `docker compose up --build admin-ui`.

`VITE_*` values are baked into the UI at build time; rebuild the `admin-ui` image after changing them.
