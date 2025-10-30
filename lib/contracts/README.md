# Contract Collaboration & Analytics

- status: active
- owner: platform
- description: Collaboration helpers that record contract revision history, inline comments, and analytics metrics for envelope lifecycle tracking.
- notes:
  - Records events in `ContractIntentMetric` via Prisma; designed for reuse by webhook handlers and background jobs.
  - `revisions.ts` exposes helpers to create revisions, update statuses, and sync comments with negotiation events.
