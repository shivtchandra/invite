# Delivery Plan (Production)

## Phase 0: Foundation (2-3 days)

- Freeze current feature behavior.
- Create Next.js app scaffold in `apps/web`.
- Add shared validation package (`packages/shared`).
- Add DB package and migration tooling.

Exit criteria:
- CI runs lint + typecheck + tests.
- Preview deployment works on Vercel.

## Phase 1: Core Product Path (4-5 days)

- Implement invite create/read/update APIs.
- Implement `/i/:slug` SSR page.
- Store invites in Postgres.
- Replace query-string sharing with slug links.

Exit criteria:
- Create invite and open shared link end-to-end from DB.

## Phase 2: Parsing and Enrichment (3-4 days)

- Implement `/api/parse-booking`.
- Add queue and worker for enrichment.
- Integrate Google Places lookup + image fallback logic.

Exit criteria:
- Parse success over 95% for sample corpus.
- Enrichment is asynchronous and retry-safe.

## Phase 3: Social + Conversion (2-3 days)

- OG image endpoint by slug.
- RSVP endpoint and participant totals.
- Add simple analytics events.

Exit criteria:
- WhatsApp/Twitter preview renders correctly.
- RSVP writes and displays counts.

## Phase 4: Hardening (3-4 days)

- Add rate limiting and idempotency.
- Add Sentry, structured logging, and alerts.
- Add integration tests and smoke load tests.

Exit criteria:
- Error budget and alert thresholds configured.
- Runbook exists for rollback and incident triage.

## Release Checklist

- Env vars configured in production and preview.
- Database backup policy enabled.
- Migrations applied and verified.
- Rate limit rules enabled.
- Monitoring dashboards populated.
- Incident contact and ownership defined.

