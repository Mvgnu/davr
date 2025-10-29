# Marketplace Deal Workspace Components

This folder houses the client components that power the buyer/seller negotiation workspace embedded in marketplace listing
pages.

## Components

- `NegotiationWorkspace`: orchestrates the timeline, contract, offer composer, and escrow widgets. Connects to the SWR powered
  hooks and exposes create/start flows for buyers.
- `NegotiationTimeline`: renders activities and status history, surfacing SLA warnings and contract milestones.
- `NegotiationOfferComposer`: provides counter-offer and acceptance controls with optimistic state updates.
- `EscrowStatusCard`: visualises escrow ledger balances and transactions.
- `NegotiationContractCard`: shows contract progress, outstanding signatures, and triggers the signing stub.

All components rely on Tailwind utility classes and the shared UI kit cards/badges/tables.
