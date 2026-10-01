# Fault Line — Web App

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Live](https://img.shields.io/badge/live-app.fault--line.dev-F4B832)](https://app.fault-line.dev)

The web client for **Fault Line**, a community infrastructure-accountability platform. Residents submit pothole / streetlight / drainage / signage reports with one tap; the system aggregates, verifies, and auto-escalates them to the responsible municipal authority with documentation that creates legal notice.

🌐 **Live:** [app.fault-line.dev](https://app.fault-line.dev) · [marketing site](https://fault-line.dev) · [📱 mobile app + backend](https://github.com/Moonligh7er/FaultLine)

## Why this exists

Most cities run a 311 system designed in the 1990s. Reports vanish, status updates don't happen, and individual complaints are easy to ignore. Every state has a **notice-of-defect** statute that creates municipal liability for unfixed reported hazards — but almost nobody triggers it because the documentation is too clunky. Fault Line is the documentation infrastructure: a one-tap photo becomes a community-verified, GPS-stamped, legally significant record that escalates automatically to the right authority.

This repo is the Next.js web client. The Expo/React Native mobile app + Supabase backend live in the [Moonligh7er/FaultLine](https://github.com/Moonligh7er/FaultLine) sibling repo. Both share the same database.

---

Next.js 15 (App Router, React 19) web app for Fault Line. Shares the same Supabase backend as the mobile app.

## Security

This app is built defensively. Every layer is hardened:

- **Strict CSP with per-request nonces** — no `unsafe-inline` for scripts. Nonces are generated in middleware, read by `app/layout.tsx` via `headers()`, and applied to every `<Script>` tag.
- **Security headers** via `next.config.ts`:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`, `frame-ancestors 'none'` in CSP
  - `Referrer-Policy: no-referrer`
  - Locked-down `Permissions-Policy`
  - `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Cross-Origin-Embedder-Policy: credentialless`
- **Supabase SSR auth** — tokens live in httpOnly, secure, sameSite=lax cookies. No tokens in localStorage. PKCE flow for magic links.
- **CSRF guard** — middleware rejects mutating requests (POST/PUT/PATCH/DELETE) whose `Origin` doesn't match the app.
- **Open-redirect guard** — login `next=` param and auth callback reject anything that isn't a same-origin relative path.
- **Zod validation** on every server action and route handler — no untrusted input reaches the database.
- **Upstash rate limiting** (sliding window): auth (5/15m), submit (10/h), vote (60/h), upload (20/h), read (300/m), tts (20/h + 1000/day site-wide). Without Upstash credentials it falls back to a per-instance in-memory limiter (weaker; set Upstash in production).
- **Photo uploads** validated by magic-byte signatures (not just MIME), 5 MB cap, whitelist of image types only.
- **CSV export** hardened against formula injection (`=+-@` prefixed with `'`), LIKE pattern escape on search, whitelist filters for category/status/state.
- **No `dangerouslySetInnerHTML`, `eval`, `new Function`** — enforced by `eslint-plugin-security`.
- **RLS-first** — all DB access respects Supabase Row Level Security. Service role key is server-only and never exposed to the client.
- **Error pages** never leak stack traces — only a digest for Sentry correlation.

## Stack

- Next.js 15 + React 19 + TypeScript (strict)
- Supabase (auth, database, storage) via `@supabase/ssr`
- Leaflet + OpenStreetMap tiles for the map (no Google Maps dependency)
- Upstash Redis for rate limiting
- Zod for runtime validation
- Sentry for error monitoring
- eslint-plugin-security for static analysis

## Setup

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Supabase URL + anon key, Upstash credentials, Sentry DSN

# 3. Dev
npm run dev         # http://localhost:3000

# 4. Typecheck / lint / build
npm run check       # tsc + eslint
npm run build       # production build
```

## Deployment (Vercel)

1. Push this directory to its own GitHub repo.
2. Import it in Vercel (New Project → import).
3. Add environment variables from `.env.example` in Project Settings.
4. Deploy. Vercel handles HTTPS, HSTS preload, and the security headers defined in `next.config.ts`.

## Directory map

```
src/
├── app/
│   ├── about/                 # Static about page
│   ├── api/export/reports/    # CSV export (server-only, auth required)
│   ├── auth/callback/         # Magic link OAuth callback
│   ├── auth/signout/          # Sign out
│   ├── authority/             # Authority list + detail
│   ├── dashboard/             # Global reports dashboard
│   ├── login/                 # Magic link login form + server action
│   ├── map/                   # Leaflet map browser
│   ├── privacy/               # Privacy policy
│   ├── profile/               # User profile + reports
│   ├── report/[id]/           # Report detail
│   │   ├── insurance/         # Insurance claim package
│   │   └── legal/             # Legal demand letter
│   ├── search/                # Search reports
│   ├── submit/                # Submit a new report
│   ├── terms/                 # Terms of service
│   ├── error.tsx              # Global error boundary
│   ├── layout.tsx             # Root layout (CSP nonce, GA, nav)
│   ├── not-found.tsx          # 404 page
│   ├── page.tsx               # Home
│   ├── robots.ts              # robots.txt
│   └── sitemap.ts             # sitemap.xml
├── components/
│   ├── LeafletMap.tsx         # Client-only Leaflet wrapper
│   └── ShareButton.tsx        # Web Share API button
├── lib/
│   ├── categories.ts          # Report category constants
│   ├── csp.ts                 # CSP nonce + header builder
│   ├── env.ts                 # Zod-validated env
│   ├── insurance.ts           # Claim evidence generator
│   ├── legal.ts               # Demand letter generator
│   ├── rate-limit.ts          # Upstash rate limiter
│   ├── supabase/              # SSR-safe Supabase clients
│   ├── types.ts               # Database row types
│   └── zod-schemas.ts         # Input validation + magic-byte check
└── middleware.ts              # CSP nonces, CSRF origin check, auth refresh, route guards
```

## Not yet built

- Sentry initialization (`@sentry/nextjs` is installed but not wired) — create `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` once you have a DSN
- AI photo analysis — mobile app uses a Supabase Edge Function; web can call the same function
- AR view (mobile-only)
- Voice reporting (mobile-only)
- Push notifications (Web Push would need separate setup)
- Offline queue (mobile-only)

## Related

- **Mobile app + Supabase backend:** [Moonligh7er/FaultLine](https://github.com/Moonligh7er/FaultLine) — Expo/React Native + edge functions, same database
- **Marketing site:** [fault-line.dev](https://fault-line.dev) — static HTML, served via GitHub Pages

## Contributing

PRs and issues welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and PR guidance, and [SECURITY.md](SECURITY.md) for the responsible-disclosure process if you find a vulnerability.

## License

[AGPL-3.0](LICENSE). The whole project is about civic transparency, so the license is too — anyone running modified versions as a service must offer the modified source to its users.

— Built by [Moonlit Social Labs](https://moonlitsociallabs.com).
