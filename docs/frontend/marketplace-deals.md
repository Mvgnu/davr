# Marketplace Deals Frontend

UI work for negotiations and escrow is staged. This document tracks the planned components and integration points introduced by the new backend primitives.

## Planned Components

* `components/marketplace/deals/NegotiationTimeline.tsx`
  * Visualises status history and offer exchanges.
  * Consumes `/api/marketplace/deals/[id]` once implemented.
* `components/marketplace/deals/OfferComposer.tsx`
  * Provides form inputs for counter-offers and acceptance flows.
  * Validates payloads using shared Zod schemas (`offerCounterSchema`, `acceptNegotiationSchema`).
  * Dispatches to `/api/marketplace/deals/[id]/offers` and `/api/marketplace/deals/[id]/accept`.
* `components/marketplace/deals/EscrowStatusCard.tsx`
  * Highlights funding requirements and escrow activity.

## Listing Detail Integration

* Extend `app/marketplace/listings/[id]/page.tsx` to:
  * Surface a “Start Negotiation” CTA for authenticated buyers.
  * Render negotiation widgets when a negotiation is active.
  * Display seller safeguards (verification, escrow requirement).

## Admin Oversight

* Add `/app/admin/deals/page.tsx` to monitor pipeline health using the new GET endpoint.
* Provide filters for status, material, and deal value and surface escrow status badges (`AWAITING_FUNDS`, `FUNDED`, `REFUNDED`).

## Dependencies

* Reuse design tokens from existing marketplace components for consistent styling.
* Integrate analytics badges from the forthcoming intelligence engine for contextual guidance.

## Next Steps

* Scaffold `components/marketplace/deals` directory with Storybook stories for each widget.
* Implement SWR hooks for negotiation polling against `GET /api/marketplace/deals/[id]` before real-time messaging lands.
* Connect component actions to the new API endpoints (counter, accept, cancel, escrow mutations).
* Add optimistic UI states for escrow operations using the ledger response payloads.
