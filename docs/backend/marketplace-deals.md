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

* Implement counter-offer, accept, cancel, and escrow mutation routes.
* Integrate role-based authorization helpers once guard utilities are centralized.
* Connect the API to the messaging service for negotiation notifications.
