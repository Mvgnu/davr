# Escrow Integration Notes

The escrow integration layer provides an abstraction over future third-party financial providers.

## Current State

* `lib/integrations/escrow.ts` exports `mockEscrowProvider`, delivering deterministic responses suitable for development.
* API routes should depend on the exported `EscrowProvider` interface rather than concrete implementations.
* Escrow mutations (`fund`, `release`, `refund`) now flow through dedicated API endpoints that emit `EscrowTransaction` ledger entries and synchronise the negotiation lifecycle.

## Planned Enhancements

1. Replace the mock provider with a configurable adapter (e.g., Mangopay, Stripe Treasury) once requirements are settled.
2. Store provider references inside `EscrowAccount.providerReference` for reconciliation.
3. Harden error handling with retry-safe idempotency keys.
4. Introduce webhook handlers for provider-originated status updates.

## Security Considerations

* Ensure secrets and API keys live in environment variables and are not committed to the repo.
* Validate that escrow operations are invoked only by authenticated parties tied to the negotiation or platform admins.
* Maintain audit logs via `NegotiationStatusHistory` and `EscrowTransaction` entries.
