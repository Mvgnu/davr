# Marketplace Deals API Routes

This directory contains the negotiation and escrow workflow endpoints.

## Endpoints

### `POST /api/marketplace/deals`

Initiates a negotiation by validating the payload, creating `Negotiation`, `OfferCounter`, `NegotiationStatusHistory`, and `EscrowAccount` records, and returning the resulting aggregate. Only authenticated buyers can call this endpoint.

### `GET /api/marketplace/deals/[id]`

Returns the latest negotiation snapshot (offers, status history, escrow state, and contract draft metadata) for authorised buyers, sellers, or admins.

### `POST /api/marketplace/deals/[id]/offers`

Allows the buyer or seller to submit counter-offers while the negotiation is active. Automatically transitions the status to `COUNTERING` and records an audit trail entry for the offer.

### `POST /api/marketplace/deals/[id]/accept`

Lets the counterparty accept the latest offer, capturing final price/quantity, kicking off contract drafting, and priming escrow for funding. Acceptance produces both contract and status history entries.

### `POST /api/marketplace/deals/[id]/cancel`

Cancels an in-flight negotiation, closes or refunds any escrow balance, and appends the cancellation note to the audit trail.

### `POST /api/marketplace/deals/[id]/escrow/fund`

Simulates escrow funding, appends ledger transactions, and promotes the negotiation to `ESCROW_FUNDED` once the expected amount is received.

### `POST /api/marketplace/deals/[id]/escrow/release`

Records escrow releases as ledger events and marks the negotiation as `COMPLETED` when the balance has been disbursed.

### `POST /api/marketplace/deals/[id]/escrow/refund`

Supports partial or full escrow refunds with automatic cancellation and closure when the full balance is returned.
