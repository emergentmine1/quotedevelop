# KWE Instant Quote Admin

Admin portal for KWE Rate & Quote: Rate Management (Freight / Origin Rate Profiles), Customer Leads,
role-based access (Read-Only / Read + Write) and Okta / Microsoft Entra ID sign-in.

```
/                     React 19 + Vite admin app (this folder)
├── src/              pages, components, lib (auth, rate-profiles, api-client)
├── public/           logo, flags/
├── .env.example      backend URL, sign-in mode, Okta settings
└── backend-java/     Spring Boot 3.5 + jOOQ API used by the admin app (see backend-java/AUTH_SETUP.md)
```

## Run with dummy data (no backend)

Needs Node.js 20+ and Yarn.

```bash
yarn install --ignore-scripts
yarn start            # http://localhost:3000
```

No `.env` needed: sign-in runs in demo mode and data is kept in the browser.
Click **Sign in with SSO** → email → **Next** → password `Demo@123`.

| Email | Access |
|---|---|
| writer@kwe.com | Read + Write — Pricing Matrix, Customer Leads, Quotes |
| reader@kwe.com | Read-Only — Customer Leads, Quotes |
| inactive@kwe.com | Denied (inactive) |
| outsider@kwe.com | Denied (no record) |

## Run with the Java backend

1. Run `backend-java/db/*.sql` against your database, then start the backend (see `backend-java/AUTH_SETUP.md`).
2. Create `.env`:
   ```
   VITE_BACKEND_URL=http://localhost:8080
   VITE_AUTH_MODE=static
   ```
3. `yarn start`. For Okta: `VITE_AUTH_MODE=okta`, `VITE_OKTA_ISSUER`, `VITE_OKTA_CLIENT_ID` (optional `VITE_OKTA_IDP_ID`).
