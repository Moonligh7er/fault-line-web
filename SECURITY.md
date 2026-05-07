# Security Policy

Thanks for taking the time to look. Fault Line handles civic-accountability data — sometimes including reporter identities, photos, and routing-to-government metadata — and we take security findings seriously.

## Reporting a vulnerability

**Please do not open a public GitHub issue.** Instead, send the details to:

📧 **moonlit-social-labs@proton.me**

Include in your report:

- A description of the issue and the impact you can observe
- Steps to reproduce (URLs, payloads, account state, browser, etc.)
- Any logs, screenshots, or proof-of-concept code
- Your name / handle if you'd like to be credited (optional)

If the finding is sensitive, you may GPG-encrypt your message — request our public key in your initial email and we'll respond with one.

## What to expect

- **Acknowledgment** within 72 hours, usually faster.
- **Triage update** within a week — severity assessment + rough fix timeline.
- **Coordinated disclosure**: we'll work with you on a timeline before any public mention. We try to ship fixes within 30 days for critical issues.
- **Credit**: if you'd like, we'll credit you in the release notes for the fix.

## Scope

In-scope:

- This repository (`fault-line-web`) — the Next.js web app at `app.fault-line.dev`
- The marketing/static site at `fault-line.dev`
- The mobile app + Supabase backend in the sibling [`Fault-Line`](https://github.com/Moonligh7er/FaultLine) repo
- Authority-routing edge functions and the public Supabase API (`*.supabase.co`)

Out of scope:

- Findings against third-party services we depend on (Supabase, Vercel, Resend, GitHub Pages) — please report those directly to the vendor.
- Self-XSS / social-engineering reports that require the victim to paste attacker-controlled JavaScript.
- Denial-of-service that requires extreme resource consumption to demonstrate.
- Issues already covered by an upstream advisory (e.g. a known Next.js CVE we haven't yet patched — let us know which one and we'll bump the dep).

## What we won't do

- We don't run a paid bounty program. We're a small civic-tech project funded by donations and grants, not bug-bounty payouts. We're happy to credit researchers and write up the finding publicly if you'd like.
- We don't take legal action against good-faith researchers who follow this policy.

Thanks for helping keep civic-accountability infrastructure honest.
