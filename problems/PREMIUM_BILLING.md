# Problem Tracker - Premium Billing Integration

- ID: PB-001
  Status: IN_PROGRESS
  Task: Wire Stripe payment adapter for premium subscription actions.
  Hypothesis: START_TRIAL and UPGRADE_CONFIRMED should create Stripe Checkout Sessions or invoices and persist identifiers for reconciliation.
  Log:
    - 2025-10-29T22:30:55Z Agent initiated Stripe integration task.
    - 2025-10-29T22:35:15Z Wired subscription API to Stripe checkout sessions and persisted billing metadata.
    - 2025-10-30T04:15:00Z Added Stripe webhook route, lifecycle reconciliation, UI gating, and regression coverage.
    - 2025-10-31T08:05:00Z Hardened entitlements with seat counts, grace/dunning prompts, automated reminders, and updated docs/UI.
    - 2025-10-31T09:40:00Z Enforced premium gating across fulfilment/dispute surfaces, blocked premium negotiations during dunning/seat overflow, and refreshed documentation/test coverage.
    - 2025-10-31T11:30:00Z Sperrkarte für Workspace-Workflow ergänzt, Offer/Contract-Aktionen bei Dunning deaktiviert und Stripe-Invoice-Failure-Regressionstest ergänzt.
