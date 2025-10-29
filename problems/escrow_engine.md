# Problem Tracker – Escrow Engine Hardening

- ID: ESC-001
- Status: DONE
- Task: Surface dispute queues, reconciliation mismatches, and funding latency KPIs in the admin console.
- Hypothesis: Admins need real-time visibility into Escrow anomalies so they can triage disputes and delayed fundings without
  poking raw database tables.
- Log:
  - 2025-10-29T20:45:00Z – Added `lib/escrow/metrics.ts` to aggregate dispute queue entries, reconciliation mismatches, and
    funding latency statistics for consumption by server components.
  - 2025-10-29T20:50:00Z – Extended `/app/admin/deals/operations/page.tsx` with dispute, reconciliation, and funding widgets;
    documented the pipeline in `docs/backend/marketplace-deals.md`.
  - 2025-10-29T21:05:00Z – Added Jest coverage for metrics aggregation and marked Initiative 2 admin visibility task as
    complete.
  - 2025-10-29T21:30:00Z – Hardened escrow webhook endpoint with HMAC verification (`ESCROW_WEBHOOK_SECRET`) and added route
    regression tests to ensure unauthenticated callbacks are rejected.
  - 2025-10-29T22:55:00Z – Added `__tests__/escrow-reconciliation-job.test.ts` to cover matched vs. mismatched provider
    statements plus idempotent replays, cementing Initiative 2 task 3 validation.
