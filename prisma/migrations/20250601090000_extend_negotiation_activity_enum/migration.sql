-- Adds new negotiation activity types for escrow dispute handling and reconciliation tracking.
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'ESCROW_DISPUTE_OPENED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'ESCROW_DISPUTE_RESOLVED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'ESCROW_STATEMENT_READY';
