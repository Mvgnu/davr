# Plan: Marketplace Negotiations & Escrow Workflow

**Goal:** Introduce structured negotiations, contract handling, and escrow-backed payments for marketplace listings so buyers and sellers can securely move from initial interest to fulfillment within DAVR.

**Schema Changes:**

*   Extend `MarketplaceListing` with relations to negotiations and flags for premium workflow participation.
*   Add negotiation lifecycle models (`Negotiation`, `NegotiationStatusHistory`) and offer exchange models (`OfferCounter`).
*   Introduce contract and escrow tracking models (`DealContract`, `EscrowAccount`, `EscrowTransaction`).
*   Add supporting enums for negotiation, contract, and escrow states.

**API Changes:**

*   Create REST endpoints under `app/api/marketplace/deals/`:
    *   ✅ `POST /api/marketplace/deals` to initiate a negotiation between a buyer and listing seller.
    *   ✅ `POST /api/marketplace/deals/[negotiationId]/offers` to submit counter-offers.
    *   ✅ `POST /api/marketplace/deals/[negotiationId]/accept` to finalize negotiated terms and trigger contract drafting.
    *   ✅ `POST /api/marketplace/deals/[negotiationId]/cancel` to cancel negotiations.
    *   ✅ `POST /api/marketplace/deals/[negotiationId]/escrow/fund` to simulate escrow deposits.
    *   ✅ `POST /api/marketplace/deals/[negotiationId]/escrow/release` to simulate release/refund operations.
    *   ✅ `GET /api/marketplace/deals/[negotiationId]` to fetch negotiation timelines, offers, and escrow state.
    *   ☐ `POST /api/marketplace/deals/[negotiationId]/contracts/sign` once signature capture is available.
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

---

## Next Session Strategic Playbook

### 1. Close the Negotiation Lifecycle Gap

*   Deliver counter-offer, acceptance, cancellation, and escrow mutation endpoints so negotiations can progress beyond the initial POST entry point.
*   Layer status guards, SLA timers, and dual-sided audit logging on each lifecycle transition to satisfy compliance requirements for high-value B2B trades.
*   Wire domain events from `lib/events/negotiations.ts` into messaging pipelines and admin oversight queues so operators observe every negotiation inflection point in real time.

### 2. Activate Buyer/Seller Deal Workspaces

*   Build negotiation timeline, offer composer, and escrow status widgets, embedding them into listing detail pages to convert passive listings into live deal rooms.
*   Introduce optimistic UI updates via SWR/React Query while counter endpoints stabilize; transition to real-time sockets once the messaging upgrade lands.
*   Provide seller dashboards summarizing active negotiations, pending actions, and escrow balances to unlock monetization through premium prioritization.

### 3. Advance Escrow & Compliance Integration

*   Extend the mocked escrow abstraction with webhooks, dispute resolution states, and reconciliation reporting so funds movement remains auditable end-to-end.
*   Implement KYC/KYB document capture within verification flows to pre-clear centers for escrow participation and reduce activation friction.
*   Wire automated alerts for SLA breaches (e.g., unfunded escrow beyond thresholds) to notify administrators and feed daily messaging digests.

### 4. Spin Up Intelligence-Driven Monetization Hooks

*   Capture negotiation pricing deltas to seed the materials intelligence engine, surfacing suggested counters and margin insights within the deal UI.
*   Tie premium tiers to advanced deal analytics—conversion probability, lead scoring, escrow priority—so billing scales with transaction throughput.
*   Prepare partner-facing APIs exposing negotiation status and escrow proofs to enable white-label or integration revenue streams once lifecycle endpoints stabilize.

### 5. Guardrails for Implementation

*   Keep Prisma models as the single source of truth; refine schema and enums before touching handlers when expanding the lifecycle.
*   Maintain living documentation—append usage notes and readiness status to backend/frontend deal guides with every new endpoint or widget.
*   Track measurable KPIs (negotiation completion rate, escrow funding time, premium conversion) to focus future iterations on the highest-leverage bottlenecks.
