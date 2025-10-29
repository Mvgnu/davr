# Marketplace Deals Backend

The deals API introduces structured negotiations, contract scaffolding, and escrow placeholders to advance the marketplace from lead generation to transaction completion.

## `POST /api/marketplace/deals`

* **Description:** Start a negotiation for a marketplace listing by submitting an initial offer.
* **Authentication:** Required. Buyer must be logged in.
* **Request Body:**
  ```json
  {
    "listingId": "ckx123...",
    "initialOfferPrice": 4200.5,
    "initialOfferQuantity": 12,
    "message": "We can commit to a recurring pickup schedule.",
    "currency": "EUR",
    "expiresAt": "2024-06-30T00:00:00.000Z"
  }
  ```
* **Success Response:**
  ```json
  {
    "negotiation": {
      "id": "neg_123",
      "status": "INITIATED",
      "currency": "EUR",
      "offers": [
        {
          "type": "INITIAL",
          "price": 4200.5,
          "quantity": 12
        }
      ],
      "escrowAccount": {
        "status": "PENDING_SETUP",
        "expectedAmount": 50406
      }
    },
    "message": "Verhandlung wurde erfolgreich gestartet"
  }
  ```
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `VALIDATION_ERROR`: Invalid payload.
  * `NOT_FOUND`: Listing does not exist.
  * `SELF_NEGOTIATION_NOT_ALLOWED`: Buyer is listing owner.
  * `LISTING_INACTIVE`: Listing is not currently active.
  * `NEGOTIATION_EXISTS`: Buyer already has an active negotiation.
  * `NEGOTIATION_INIT_FAILED`: Unexpected server failure.

## `GET /api/marketplace/deals/[id]`

* **Description:** Returns the current negotiation aggregate (offers, status history, escrow ledger) for the buyer, seller, or administrators.
* **Authentication:** Required. Only parties to the negotiation or admins receive access.
* **Error Codes:**
  * `UNAUTHENTICATED`: Session missing.
  * `NEGOTIATION_NOT_FOUND`: Negotiation ID invalid.
  * `NEGOTIATION_FORBIDDEN`: Caller is not a party nor an admin.
  * `NEGOTIATION_EXPIRED`: SLA elapsed and negotiation was auto-closed.

## `POST /api/marketplace/deals/[id]/offers`

* **Description:** Submit a counter-offer, automatically switching the lifecycle to `COUNTERING` on the first counter.
* **Authentication:** Required. Buyer or seller only.
* **Request Body:**
  ```json
  {
    "price": 4100.0,
    "quantity": 12,
    "message": "Can split delivery into two batches?",
    "type": "COUNTER"
  }
  ```
* **Error Codes:**
  * `NEGOTIATION_CLOSED`: Negotiation already completed/cancelled.
  * `NEGOTIATION_STATUS_INVALID`: Current status forbids new counters.
  * `NEGOTIATION_COUNTER_FAILED`: Unexpected persistence failure.

## `POST /api/marketplace/deals/[id]/accept`

* **Description:** Accept the latest counter-offer. Captures the agreed price/quantity, begins contract drafting, and flips escrow to `AWAITING_FUNDS`.
* **Authentication:** Required. Opposing party only (cannot accept your own offer).
* **Request Body:**
  ```json
  {
    "agreedPrice": 4150.0,
    "agreedQuantity": 12,
    "note": "Draft contract with staged pickup clause."
  }
  ```
* **Error Codes:**
  * `NEGOTIATION_NO_OFFER`: No offer exists to accept.
  * `NEGOTIATION_PRICE_REQUIRED`: Final price missing.
* **Side Effects:**
  * Creates a `OfferCounter` record flagged as `FINAL`.
  * Upserts the `DealContract` row and primes escrow with the new amount expectation.

## `POST /api/marketplace/deals/[id]/cancel`

* **Description:** Cancels the negotiation and closes or refunds escrow balances.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "reason": "Supplier can no longer guarantee spec compliance."
  }
  ```
* **Behavior:**
  * Refunds any outstanding escrow funds via `EscrowTransaction` entries.
  * Adds a cancellation note to `NegotiationStatusHistory` and persists the message to `Negotiation.notes`.

## `POST /api/marketplace/deals/[id]/escrow/fund`

* **Description:** Records escrow deposits and transitions the negotiation to `ESCROW_FUNDED` once the expected amount is collected.
* **Authentication:** Required. Buyer, seller, or admin.
* **Request Body:**
  ```json
  {
    "amount": 5000,
    "reference": "wire-123"
  }
  ```
* **Error Codes:**
  * `ESCROW_NOT_INITIALISED`: Negotiation missing an escrow account.
  * `NEGOTIATION_STATUS_INVALID`: Funding attempted from an unsupported lifecycle stage.

## `POST /api/marketplace/deals/[id]/escrow/release`

* **Description:** Releases escrow funds to the seller. When the escrow balance hits zero, the negotiation is marked `COMPLETED`.
* **Authentication:** Required. Buyer, seller, or admin.
* **Error Codes:**
  * `ESCROW_RELEASE_EXCEEDS_FUNDS`: Release amount greater than current escrow balance.

## `POST /api/marketplace/deals/[id]/escrow/refund`

* **Description:** Issues partial or full refunds back to the buyer. Fully refunded negotiations auto-transition to `CANCELLED` and close the escrow account.
* **Authentication:** Required. Buyer, seller, or admin.
* **Error Codes:**
  * `ESCROW_REFUND_EXCEEDS_FUNDS`: Refund amount greater than remaining escrow balance.

## Prisma Models

* `Negotiation`: Tracks listing, buyer/seller pair, statuses, agreed terms, and metadata.
* `OfferCounter`: Stores negotiation messages and offer payloads.
* `NegotiationStatusHistory`: Time-series log of status transitions.
* `DealContract`: Placeholder for structured contract drafting/signature workflow.
* `EscrowAccount`: Mirrors escrow account state and expected funds.
* `EscrowTransaction`: Ledger for escrow fund, release, and refund events.

## Enums

* `NegotiationStatus`: Lifecycle for deals (initiation, countering, contracting, escrow, closure).
* `OfferType`: Distinguishes initial offers, counters, finals, and system adjustments.
* `ContractStatus`: Tracks contract drafting and signature phases.
* `EscrowStatus`: Monitors escrow readiness, funding, release, and dispute states.
* `EscrowTransactionType`: Categorises escrow ledger events.

## Next Steps

* Wire actual messaging/queue integrations to consume the new domain events (`lib/events/negotiations.ts`).
* Expand SLA handling to notify participants before automatic expiration kicks in.
* Implement contract signature webhooks so the lifecycle can advance from `CONTRACT_DRAFTING` to `CONTRACT_SIGNED`.
