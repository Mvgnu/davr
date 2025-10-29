# Marketplace Deals API Routes

This directory contains the negotiation and escrow workflow endpoints.

## Endpoints

### `POST /api/marketplace/deals`

Initiates a negotiation by validating the payload, creating `Negotiation`, `OfferCounter`, `NegotiationStatusHistory`, and `EscrowAccount` records, and returning the resulting aggregate. Only authenticated buyers can call this endpoint.

Additional routes for counter-offers, acceptance, cancellation, and escrow operations will be added alongside this file as the workflow expands.
