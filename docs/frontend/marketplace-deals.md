# Marketplace Deals Frontend

The negotiation workspace is now live on listing detail pages. This document summarises the components, data flow, and admin
console that ship with the first iteration.

## Workspace Components

* `components/marketplace/deals/NegotiationWorkspace.tsx`
  * Client orchestrator that renders the timeline, contract status, offer composer, and escrow ledger widgets.
  * Bootstraps negotiations via `/api/marketplace/deals` and hydrates data with the SWR hook (`useNegotiationWorkspace`).
* `components/marketplace/deals/NegotiationTimeline.tsx`
  * Merges `negotiation.activities` and `statusHistory` into a chronological list.
  * Highlights SLA warnings (`NEGOTIATION_SLA_WARNING`, `NEGOTIATION_SLA_BREACHED`) with amber/destructive badges.
* `components/marketplace/deals/NegotiationOfferComposer.tsx`
  * Handles counter and acceptance flows with optimistic updates and form validation.
  * Dispatches to `/api/marketplace/deals/[id]/offers` and `/api/marketplace/deals/[id]/accept`.
* `components/marketplace/deals/EscrowStatusCard.tsx`
  * Visualises expected vs. funded balances and transaction history from the ledger payload.
* `components/marketplace/deals/NegotiationContractCard.tsx`
  * Surfaces signature state, pending steps, and calls the signing stub at `/api/marketplace/deals/[id]/contracts/sign`.

## Listing Detail Integration

`app/marketplace/listings/[listingId]/page.tsx` now:

* Pre-loads the latest negotiation for the current user (buyer or seller) and passes it to the workspace.
* Renders a “Verhandlung starten” card for authenticated buyers without an active negotiation.
* Displays the interactive workspace with role-aware CTAs, escrow ledger, and contract progress.

### API Snapshot

`GET /api/marketplace/deals/{id}` returns the negotiation snapshot and KPI envelope:

```json
{
  "negotiation": {
    "id": "neg_123",
    "status": "CONTRACT_DRAFTING",
    "offers": [/* latest 25 offers */],
    "activities": [/* persisted lifecycle events */],
    "escrowAccount": {
      "expectedAmount": 12500,
      "fundedAmount": 7500,
      "transactions": [/* ledger entries */]
    },
    "contract": {
      "status": "PENDING_SIGNATURES",
      "buyerSignedAt": null,
      "sellerSignedAt": "2025-10-29T15:20:00.000Z"
    }
  },
  "kpis": {
    "premiumWorkflow": true,
    "escrowFundedRatio": 0.6,
    "completed": false
  }
}
```

## Admin Oversight Console

`/app/admin/deals/page.tsx` lists the 50 most recent negotiations with filters for lifecycle status, SLA risk buckets (24h risk,
breached), and premium vs. standard workflows. Summary cards include active negotiation count, escrow volume, and SLA risk
count. Each row shows the escrow balance, premium badge, and last activity timestamp.

## Telemetry Notes

* Workspace components rely on `useNegotiationWorkspace`, which polls every 15s and applies optimistic updates for counter and
  signing flows.
* KPI data is included in the API response for downstream analytics (completion, escrow funding ratio, premium flag) and is
  surfaced in the admin dashboard.

## Follow-ups

* Wire the SLA watchdog job (`lib/jobs/negotiations/sla.ts`) into a scheduled worker to emit warnings proactively.
* Replace optimistic polling with websocket updates once the messaging service lands.
* Capture screenshot assets for the design system once visual QA is finalised.
