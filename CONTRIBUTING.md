# Contributing to Fault Line Web

Glad you're here. This is a small civic-tech project; outside contributions are very welcome.

## Issues

- **Bugs**: include a clear repro (URL, account state if any, browser, what you saw vs expected). Screenshots help.
- **Feature requests**: describe the user problem, not just the proposed solution. We'll talk through approaches.
- **Security**: please do **not** file public issues. See [SECURITY.md](SECURITY.md) for the responsible-disclosure process.

## Pull requests

PRs are welcome on any open issue. For larger changes, please open an issue first to align on approach — saves you from writing code that gets rejected for direction reasons.

**Workflow:**

1. Fork the repo, create a feature branch from `main`.
2. Make your changes. Keep commits small and focused; we squash-merge so commit hygiene matters less than PR description quality.
3. Run the test suite locally: `npm test` (Vitest) and `npm run e2e` (Playwright if your change touches user-facing routes).
4. Run the build: `npm run build` (catches TypeScript and ESLint issues that the dev server hides).
5. Open a PR. In the description, briefly explain *why* the change is being made and *what* you tested.

**Code style:**

- TypeScript strict mode is on. Avoid `any` unless there's a documented reason.
- Use the existing Supabase client wrappers (`@/lib/supabase/server` for server contexts, `@/lib/supabase/client` for client). Don't construct raw clients.
- Server-only modules must never be imported from `'use client'` files. The wrapper has a `typeof window` guard but please don't lean on it.
- Avoid adding new dependencies for things the standard library + existing deps can already do.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your dev values (Supabase publishable key, etc.). The service-role key is **only** needed if your change touches admin/server routes; you can ask in the PR if you need access to a dev project.
3. `npm run dev` — runs Next.js dev server on `http://localhost:3000`.

The mobile app + Supabase backend live in the sibling repo [`Moonligh7er/FaultLine`](https://github.com/Moonligh7er/FaultLine). For end-to-end testing, you'll likely want to run a local Supabase via `supabase start` from that repo and point both apps at it.

## License

By submitting a contribution, you agree your code is licensed under the project's [AGPL-3.0 license](LICENSE). The AGPL is a strong copyleft — anyone who runs a modified version as a service must offer the modified source to its users. We chose it on purpose; the whole project is about civic transparency, and the license should reflect that.

If you have questions about whether a contribution is welcome, or want to talk through architecture, file an issue or email **moonlit-social-labs@proton.me**.

Thanks for helping. — Moonlit Social Labs
