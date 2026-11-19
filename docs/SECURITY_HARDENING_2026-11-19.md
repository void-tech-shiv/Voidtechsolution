# Security and Reliability Hardening — 19 November 2026

## Scope

This branch contains targeted fixes for administrative login, public enquiries,
session-cookie signing, and related regression tests. Changes are isolated from
`main` until the pull request is reviewed and merged.

## Changes

1. **Trusted client address resolution:** `getTrustedClientIp()` uses proxy
   headers only when `TRUST_PROXY=true`. The ingress **must** strip client
   supplied `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For` before
   setting authoritative values. Without a verified ingress, the application
   does not trust those headers. The public Server Action no longer accepts
   a client-supplied IP parameter.
2. **Enquiry throttling:** Separate email-fingerprint and, when available,
   trusted-IP budgets. Email keys are SHA-256 hashes rather than plain emails;
   stored IP metadata is an HMAC digest (never an address string).
   This avoids one shared `127.0.0.1` bucket for every contact visitor.
3. **Login throttling:** Independent per-IP (20/15 minutes) and per-account
   (10/15 minutes) *failed attempt* budgets. Successful logins do not
   increment failed-login counters.
4. **Retry behavior:** An enquiry fingerprint is reserved while persistence
   occurs; the reservation is released on database failure so an immediate
   retry can work. This is an in-process duplicate filter, **not**
   cross-instance idempotency.
5. **Notifications:** Await the two existing transactional email attempts
   before finishing the request. Email failure does not undo a persisted
   enquiry. This trades a slower response for better reliability than
   fire-and-forget on short-lived serverless workers.
6. **Session secrets:** Production now refuses to sign or verify sessions
   without a configured `AUTH_SECRET` of at least 32 characters.
7. **API response:** Database interruptions return HTTP 503 rather than
   being misreported as HTTP 400.

## Required deployment configuration

- `AUTH_SECRET`: Random, private, 32+ characters in production; keep it
  identical on all application instances. Rotating it invalidates active
  session cookies.
- `TRUST_PROXY`: Leave unset/false by default. Set to `true` **only** when a
  trusted reverse proxy controls and sanitizes all forwarded client IP headers.
- `IP_HASH_SECRET`: Optional dedicated private 32+ character key used to
  HMAC the visitor IP for enquiry metadata; otherwise `AUTH_SECRET` is
  used. Prefer a dedicated key to avoid coupling it to session rotation.

## Known limitations / outstanding work

- The existing `rate-limiter.ts` uses process-local Maps. It is **not**
  effective as a standalone cross-instance production brute-force defense.
  Protect login and enquiry routes using infrastructure rate limits/WAF,
  and move counters into a shared store (Redis/Cloudflare Durable Object,
  etc.) before a multi-instance release. The app itself documents this.
- In-process duplicate detection cannot guarantee exactly-once enquiry writes
  across concurrent workers. For production, add a database unique
  idempotency key with an atomic insert and transactional outbox.
- Email is awaited, but this is not a durable queue. Use an outbox/worker
  before high-volume deployment. The current SMTP retries can delay replies.
- `getEnquiries()` and `getEnquiryById()` in `enquiries.repo.ts` still
  coerce some database failures into empty results/null. A separate CRM
  error-state design is needed before changing their public contracts.
- This branch has source-level review and regression tests added, but
  successful execution of the full test/build suite is **not** claimed.

## Validation on Windows 11 PowerShell

```powershell
npm ci
npx prisma generate
npm run typecheck
npm test
npm run build
```

After the change, verify ordinary contact forms, HTTP 429/503 behavior,
rapid retry after a simulated database outage, successful and failed
administrator login, expiry/revocation of sessions, and email delivery.
