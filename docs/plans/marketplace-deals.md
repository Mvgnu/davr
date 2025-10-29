# Plan: Marketplace Negotiations & Escrow Workflow

**Goal:** Introduce structured negotiations, contract handling, and escrow-backed payments for marketplace listings so buyers and sellers can securely move from initial interest to fulfillment within DAVR.

**Schema Changes:**

*   Extend `MarketplaceListing` with relations to negotiations and flags for premium workflow participation.
*   Add negotiation lifecycle models (`Negotiation`, `NegotiationStatusHistory`) and offer exchange models (`OfferCounter`).
*   Introduce contract and escrow tracking models (`DealContract`, `EscrowAccount`, `EscrowTransaction`).
*   Add supporting enums for negotiation, contract, and escrow states.

**API Changes:**

*   Create REST endpoints under `app/api/marketplace/deals/`:
    *   `POST /api/marketplace/deals` to initiate a negotiation between a buyer and listing seller.
    *   `POST /api/marketplace/deals/[negotiationId]/offers` to submit counter-offers.
    *   `POST /api/marketplace/deals/[negotiationId]/accept` to finalize negotiated terms and trigger contract drafting.
    *   `POST /api/marketplace/deals/[negotiationId]/cancel` to cancel negotiations.
    *   `POST /api/marketplace/deals/[negotiationId]/escrow/fund` to simulate escrow deposits.
    *   `POST /api/marketplace/deals/[negotiationId]/escrow/release` to simulate release/refund operations.
    *   `GET /api/marketplace/deals/[negotiationId]` to fetch negotiation timelines, offers, and escrow state.
*   Implement middleware-backed guards that ensure only parties to the deal can interact with restricted endpoints and that admins retain oversight.
*   Integrate placeholder service `lib/integrations/escrow.ts` exposing typed hooks for future provider integration (e.g., create escrow account, fund, release, refund).

**Frontend Changes:**

*   Add negotiation widgets in `app/marketplace/listings/[id]/page.tsx` that allow authenticated buyers to start negotiations and sellers to track activity.
*   Create modular UI components under `components/marketplace/deals/`:
    *   `NegotiationTimeline` for event history.
    *   `OfferComposer` for entering price/quantity counter-offers.
    *   `EscrowStatusCard` summarizing funds held and pending actions.
*   Provide admin oversight views at `app/admin/deals` to monitor negotiations, contract status, and escrow events.
*   Surface inline guidance using analytics once the intelligence engine ships.

**Documentation:**

*   Document API flows in `docs/backend/marketplace-deals.md` with request/response payloads.
*   Document UI components in `docs/frontend/marketplace-deals.md`.
*   Outline escrow integration touchpoints in `docs/backend/integrations/escrow.md`.
*   Update `docs/progress_tracker.md` after each major milestone.

**Testing:**

*   Add Jest integration tests in `__tests__/marketplace/deals.test.ts` covering negotiation creation, offer sequences, status transitions, and escrow edge cases using Prisma test helpers.
*   Implement component tests in `__tests__/components/marketplace/NegotiationTimeline.test.tsx` once UI is available.
*   Add contract tests for API endpoints verifying role enforcement and state transitions.

**Open Questions / Follow-Up:**

*   Determine notification strategy (in-app vs. email) once messaging upgrade lands.
*   Clarify compliance requirements for real escrow providers (KYC/AML) before production rollout.
*   Evaluate monetization hooks (premium escrow tiers, negotiation analytics) after baseline workflow is functional.
