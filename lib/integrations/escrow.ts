import { randomUUID } from 'crypto';

import { EscrowStatus, EscrowTransactionType } from '@prisma/client';

/**
 * meta: module=escrow-integration version=0.3 owner=platform
 * Provider abstraction describing how the platform communicates with the escrow backend.
 */
export interface CreateEscrowAccountInput {
  negotiationId: string;
  expectedAmount: number;
  currency: string;
}

export interface EscrowTransactionPayload {
  escrowAccountId: string;
  providerReference: string;
  amount: number;
  type: EscrowTransactionType;
  reference?: string;
  occurredAt?: Date;
  memo?: string;
}

export interface EscrowDisputePayload {
  escrowAccountId: string;
  providerReference: string;
  reason: string;
  amount?: number;
  reference?: string;
}

export interface EscrowProviderTransactionResult {
  status: EscrowStatus;
  externalTransactionId: string;
  occurredAt: Date;
  balance: number;
}

export interface EscrowProviderAccount {
  providerReference: string;
  status: EscrowStatus;
  metadata?: Record<string, unknown>;
}

export interface EscrowProviderStatement {
  statementId: string;
  providerReference: string;
  balance: number;
  disputed: boolean;
  generatedAt: Date;
  transactions: Array<{
    id: string;
    type: EscrowTransactionType;
    amount: number;
    occurredAt: Date;
  }>;
}

export type EscrowWebhookEventType =
  | 'funding_confirmed'
  | 'release_settled'
  | 'refund_processed'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'statement_ready';

export interface EscrowWebhookEnvelope {
  event: EscrowWebhookEventType;
  providerReference: string;
  externalTransactionId: string;
  amount?: number;
  currency?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface EscrowProvider {
  createAccount(input: CreateEscrowAccountInput): Promise<EscrowProviderAccount>;
  fund(payload: EscrowTransactionPayload): Promise<EscrowProviderTransactionResult>;
  release(payload: EscrowTransactionPayload): Promise<EscrowProviderTransactionResult>;
  refund(payload: EscrowTransactionPayload): Promise<EscrowProviderTransactionResult>;
  dispute(payload: EscrowDisputePayload): Promise<{ status: EscrowStatus; disputeReference: string }>;
  getStatement(providerReference: string): Promise<EscrowProviderStatement>;
}

type MemoryTransaction = {
  id: string;
  type: EscrowTransactionType;
  amount: number;
  occurredAt: Date;
};

type MemoryAccount = {
  id: string;
  negotiationId: string;
  expectedAmount: number;
  currency: string;
  balance: number;
  status: EscrowStatus;
  disputed: boolean;
  transactions: MemoryTransaction[];
};

/**
 * meta: strategy=mock integration
 * In-memory provider to emulate a remote escrow system for local development and tests.
 */
export class InMemoryEscrowProvider implements EscrowProvider {
  private accounts = new Map<string, MemoryAccount>();

  async createAccount(input: CreateEscrowAccountInput): Promise<EscrowProviderAccount> {
    const providerReference = `mem_${randomUUID()}`;
    this.accounts.set(providerReference, {
      id: input.negotiationId,
      negotiationId: input.negotiationId,
      expectedAmount: input.expectedAmount,
      currency: input.currency,
      balance: 0,
      status: EscrowStatus.PENDING_SETUP,
      disputed: false,
      transactions: [],
    });

    return { providerReference, status: EscrowStatus.PENDING_SETUP };
  }

  async fund(payload: EscrowTransactionPayload): Promise<EscrowProviderTransactionResult> {
    const account = this.requireAccount(payload.providerReference);
    const occurredAt = payload.occurredAt ?? new Date();
    const id = payload.reference ?? `fund_${randomUUID()}`;
    account.balance += payload.amount;
    account.transactions.push({ id, type: EscrowTransactionType.FUND, amount: payload.amount, occurredAt });

    const expected = account.expectedAmount ?? 0;
    if (expected > 0 && account.balance >= expected - 0.01) {
      account.status = EscrowStatus.FUNDED;
    } else {
      account.status = EscrowStatus.AWAITING_FUNDS;
    }

    return {
      status: account.status,
      externalTransactionId: id,
      occurredAt,
      balance: account.balance,
    };
  }

  async release(payload: EscrowTransactionPayload): Promise<EscrowProviderTransactionResult> {
    const account = this.requireAccount(payload.providerReference);
    const occurredAt = payload.occurredAt ?? new Date();
    const id = payload.reference ?? `rel_${randomUUID()}`;
    account.balance = Math.max(account.balance - payload.amount, 0);
    account.transactions.push({ id, type: EscrowTransactionType.RELEASE, amount: payload.amount, occurredAt });

    if (account.balance <= 0.01) {
      account.status = EscrowStatus.RELEASED;
    } else {
      account.status = EscrowStatus.FUNDED;
    }

    return {
      status: account.status,
      externalTransactionId: id,
      occurredAt,
      balance: account.balance,
    };
  }

  async refund(payload: EscrowTransactionPayload): Promise<EscrowProviderTransactionResult> {
    const account = this.requireAccount(payload.providerReference);
    const occurredAt = payload.occurredAt ?? new Date();
    const id = payload.reference ?? `ref_${randomUUID()}`;
    account.balance = Math.max(account.balance - payload.amount, 0);
    account.transactions.push({ id, type: EscrowTransactionType.REFUND, amount: payload.amount, occurredAt });

    if (account.balance <= 0.01) {
      account.status = EscrowStatus.REFUNDED;
    } else {
      account.status = EscrowStatus.FUNDED;
    }

    return {
      status: account.status,
      externalTransactionId: id,
      occurredAt,
      balance: account.balance,
    };
  }

  async dispute(payload: EscrowDisputePayload): Promise<{ status: EscrowStatus; disputeReference: string }> {
    const account = this.requireAccount(payload.providerReference);
    const disputeReference = payload.reference ?? `dispute_${randomUUID()}`;
    account.status = EscrowStatus.DISPUTED;
    account.disputed = true;

    account.transactions.push({
      id: disputeReference,
      type: EscrowTransactionType.ADJUSTMENT,
      amount: payload.amount ?? 0,
      occurredAt: new Date(),
    });

    return { status: account.status, disputeReference };
  }

  async getStatement(providerReference: string): Promise<EscrowProviderStatement> {
    const account = this.requireAccount(providerReference);
    const statementId = `stmt_${randomUUID()}`;

    return {
      statementId,
      providerReference,
      balance: Number(account.balance.toFixed(2)),
      disputed: account.disputed,
      generatedAt: new Date(),
      transactions: account.transactions.slice(-20).map((txn) => ({ ...txn })),
    };
  }

  private requireAccount(providerReference: string): MemoryAccount {
    const account = this.accounts.get(providerReference);
    if (!account) {
      throw new Error(`ESCROW_ACCOUNT_MISSING:${providerReference}`);
    }
    return account;
  }
}

const defaultProvider = new InMemoryEscrowProvider();

let activeProvider: EscrowProvider = defaultProvider;

export function getEscrowProvider(): EscrowProvider {
  return activeProvider;
}

export function registerEscrowProvider(provider: EscrowProvider) {
  activeProvider = provider;
}

export const mockEscrowProvider = defaultProvider;
