# Marketplace Deal Workspace Components

This folder houses the client components that power the buyer/seller negotiation workspace embedded in marketplace listing
pages.

## Components

- `NegotiationWorkspace`: orchestrates the timeline, contract, offer composer, and escrow widgets. Connects to the SSE-enhanced
  `useNegotiationWorkspace` hook and exposes create/start flows for buyers.
- `NegotiationTimeline`: renders activities and status history, surfacing SLA warnings, contract milestones, and unread real-
  time notifications.
- `NegotiationOfferComposer`: provides counter-offer and acceptance controls with optimistic state updates.
- `EscrowStatusCard`: visualises escrow ledger balances, reconciliation/dispute warnings, and annotated transaction history.
- `NegotiationContractCard`: shows contract progress, outstanding signatures, provider envelope status, and exposes document
  preview links with retry messaging.
- `NegotiationPremiumInsights`: gated analytics card that surfaces offer iteration counts, time-in-stage, and SLA plan details
  when the viewer's premium entitlements expose `hasAdvancedAnalytics`.
- `AdminPremiumUpgradeFlow`: admin-only workflow that triggers premium subscription API actions (trial start, concierge
  activation) and surfaces status messaging while logging conversion events.
- `SchedulerJobTriggerButton`: inline manual scheduler trigger that posts to the server action, refreshes the dashboard on
  success, and displays per-job feedback without query-string redirects.

All components rely on Tailwind utility classes and the shared UI kit cards/badges/tables.
