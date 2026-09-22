# KWE Admin (separated repo)

This folder is the **original full KWE application** (React 19 + Vite), containing everything
EXCEPT the public Instant Quote flow's Next.js migration:

- Auth / Login / Forgot / Reset password
- Dashboard, Quote Search / Results / Comparison, Booking, Shipments, Invoices, Notifications
- Provider pages (dashboard, rates, routes, booking requests, analytics)
- Admin pages (provider management, leads, pricing matrices: air/lcl/fcl/surcharge, history, calculator)

It was split out of the public app so it can be pushed as its **own GitHub repository**.

## Status
- Still a Vite SPA (unchanged). Run with `yarn install && yarn start` (port 3000).
- The public Next.js quote tool now lives separately in `/app/frontend`.

## To publish as a separate repo
Move/copy this folder into a fresh Git repository and push it. It is self-contained
(has its own package.json, vite.config.js, tailwind config, etc.).
