# KWE Instant Quote Admin — Authentication & Roles

## What is done vs. what needs your environment

| Piece | Status |
|---|---|
| Admin login page, logout, session expiry, Access Denied page | Done (kwe-admin) |
| Role-based menu (Pricing Matrix / Customer Leads / Quotes) + route guards | Done (kwe-admin) |
| Spring Security: token validation, DB role lookup, 401/403 on every admin API | Code done — **compile & run on your machine** (needs DB for jOOQ) |
| `quoteownr.kwe_admin_users` + `quoteownr.kwe_pricing_matrix` SQL | Done — **you run the scripts** |
| Pricing matrix REST API (READ_WRITE only) | Code done — untested here (no DB in this environment) |
| Okta + Microsoft Entra ID sign-in | Code done & configurable — **not operational until Okta values are supplied and tested** |
| Temporary dummy logins | Done (`static` = via backend, `demo` = browser only) |

## 1. Database (run before `mvn compile` — jOOQ codegen reads these tables)

```bash
psql "$DB_URL" -f db/001_kwe_admin_users.sql
psql "$DB_URL" -f db/002_kwe_pricing_matrix.sql
psql "$DB_URL" -f db/900_seed_dummy_admin_users.sql   # dummy users, NOT for production
```

Rules enforced by the table: unique lower-case email, role ∈ {READ_ONLY, READ_WRITE}, new users default to
`is_active = false`, an active user must have a role. Add a real user:

```sql
INSERT INTO quoteownr.kwe_admin_users (email, role, is_active) VALUES ('jane.doe@kwe.com', 'READ_WRITE', TRUE);
```

## 2. Backend environment (Spring, `backend-java`)

| Variable | Example | Notes |
|---|---|---|
| `KWE_AUTH_MODE` | `okta` / `static` | Default `okta`. `static` = dummy logins, local only |
| `OKTA_ISSUER` | `https://kwe.okta.com/oauth2/default` | Required in okta mode (custom authorization server) |
| `OKTA_AUDIENCE` | `api://kwe-instant-quote` | Must match the `aud` of Okta access tokens |
| `KWE_AUTH_EMAIL_CLAIMS` | `email,sub` | Claims checked (in order) for the user's email |
| `STATIC_JWT_SECRET` | 32+ random chars | Static mode only |
| `STATIC_LOGIN_PASSWORD` | `Demo@123` | Static mode only; shared dummy password, never stored in DB |
| `STATIC_JWT_TTL_MINUTES` | `60` | Static token lifetime |
| `KWE_CORS_ALLOWED_ORIGIN_PATTERNS` | `http://localhost:*` | Admin app origin(s) |

The app fails fast on startup if okta mode has no issuer or static mode has a short secret.

## 3. Admin app environment (`kwe-admin/.env`, see `.env.example`)

| Variable | Notes |
|---|---|
| `VITE_BACKEND_URL` | e.g. `http://localhost:8080` |
| `VITE_AUTH_MODE` | `okta` (production), `static` (dummy logins via backend), `demo` (browser-only, previews) |
| `VITE_OKTA_ISSUER` | Same issuer as backend |
| `VITE_OKTA_CLIENT_ID` | Okta SPA app client ID (public, no secret) |
| `VITE_OKTA_IDP_ID` | Optional: Okta IdP ID of the Entra ID provider, sends users straight to Microsoft |
| `VITE_OKTA_SCOPES` | Default `openid profile email` |

If `VITE_AUTH_MODE` is unset: `demo` in `yarn start` (dev), `okta` in production builds.

## 4. Okta / Entra ID setup (environment owner)

1. Entra ID: register an app for Okta, redirect URI `https://<okta-domain>/oauth2/v1/authorize/callback`.
2. Okta: Security → Identity Providers → add OpenID Connect IdP with the Entra client ID/secret; note the IdP ID.
   Add a routing rule (e.g. `@kwe.com` → Entra) or set `VITE_OKTA_IDP_ID`.
3. Okta: Applications → Create OIDC **Single-Page Application**, Authorization Code + PKCE, no client secret.
   Sign-in redirect `https://<admin-host>/login/callback`, sign-out redirect `https://<admin-host>/login`.
4. Okta custom authorization server: audience = `OKTA_AUDIENCE`; make sure access tokens carry the
   user's email in `sub` or an `email` claim. MFA and remembered sessions follow your Okta/Entra policies.

## 5. Flow & enforcement

1. `/login` → **Login** → Okta (→ Entra ID, MFA) → `/login/callback` (PKCE code exchange).
2. Admin app calls `GET /api/v1/auth/me` with the access token. The backend validates signature, issuer,
   audience and expiry, normalises the email, reads `kwe_admin_users` **on every request**, and returns the role.
3. No row / inactive / invalid role / DB error ⇒ no authority ⇒ **403** ⇒ Access Denied page. Never defaults to a role.
4. Role is re-checked every 5 minutes in the UI and on every API call server-side.

| Endpoint | Rule |
|---|---|
| `GET /api/v1/masterdata/**`, `/api/v1/profiledata/**`, `POST /api/v1/quote-requests` | Public (quote form) |
| `POST /api/v1/auth/static-login` | Public, **static mode only** (404 otherwise) |
| `GET /api/v1/auth/me` | Any valid token (403 if no role) |
| `GET /api/v1/quote-requests` | READ_ONLY or READ_WRITE |
| `PATCH /api/v1/quote-requests/{qrid}/status` | READ_WRITE |
| `GET/POST/PUT/DELETE /api/v1/pricing-matrices[/{id}]` | READ_WRITE |
| anything else | denied |

401 = missing/invalid/expired token, 403 = authenticated without permission. Stateless bearer tokens (no
cookies), so CSRF protection is not needed; CORS is restricted to `KWE_CORS_ALLOWED_ORIGIN_PATTERNS`.

## 6. Dummy accounts (static & demo modes)

| Email | Result |
|---|---|
| writer@kwe.com | READ_WRITE — Pricing Matrix, Customer Leads, Quotes |
| reader@kwe.com | READ_ONLY — Customer Leads, Quotes |
| inactive@kwe.com | Denied (inactive) |
| outsider@kwe.com | Denied (no record) |

Password: `STATIC_LOGIN_PASSWORD` (static) or `Demo@123` (demo). To switch to Okta later: set
`KWE_AUTH_MODE=okta` + `OKTA_*` on the backend and `VITE_AUTH_MODE=okta` + `VITE_OKTA_*` in the admin app,
then delete the dummy rows.

## 7. Tests

```bash
cd backend-java && ./mvnw test
```
- `SecurityRulesTest` — mocked identity provider: 401 without/invalid token, READ_ONLY read-only, READ_WRITE writes,
  no-role user 403, `/auth/me` role, public quote submit, static login hidden in okta mode.
- `AdminUserServiceTest` — missing, inactive, invalid role, DB failure (fail closed), email normalisation.
- `StaticTokenServiceTest` — token issue/verify, wrong password, foreign signature rejected, okta config fail-fast.
