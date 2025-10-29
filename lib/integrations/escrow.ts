import { EscrowStatus, EscrowTransactionType } from '@prisma/client';

/**
 * meta: module=escrow-integration version=0.1 owner=platform
 * Lightweight abstraction for escrow provider interactions.
 */
export interface CreateEscrowAccountInput {
  negotiationId: string;
  expectedAmount: number;
  currency: string;
}

export interface EscrowTransactionPayload {
  escrowAccountId: string;
  amount: number;
  type: EscrowTransactionType;
  reference?: string;
}

export interface EscrowProvider {
  createAccount(input: CreateEscrowAccountInput): Promise<{ providerReference: string; status: EscrowStatus }>;
  fund(payload: EscrowTransactionPayload): Promise<{ status: EscrowStatus }>;
  release(payload: EscrowTransactionPayload): Promise<{ status: EscrowStatus }>;
  refund(payload: EscrowTransactionPayload): Promise<{ status: EscrowStatus }>;
}

/**
 * meta: strategy=mock integration
 * Temporary mock provider for local development. Replace with banking API implementation later.
 */
export const mockEscrowProvider: EscrowProvider = {
  async createAccount() {
    return { providerReference: `mock_${Date.now()}`, status: EscrowStatus.PENDING_SETUP };
  },
  async fund() {
    return { status: EscrowStatus.FUNDED };
  },
  async release() {
    return { status: EscrowStatus.RELEASED };
  },
  async refund() {
    return { status: EscrowStatus.REFUNDED };
  },
};
