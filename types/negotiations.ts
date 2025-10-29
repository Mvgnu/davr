/**
 * meta: module=negotiations type=snapshot version=0.1 owner=platform
 */
export interface NegotiationActivity {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  audience: 'PARTICIPANTS' | 'ADMIN' | 'ALL';
  status?: string | null;
  occurredAt: string;
  triggeredById?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface NegotiationOffer {
  id: string;
  senderId: string;
  price: number | null;
  quantity: number | null;
  message?: string | null;
  type: string;
  createdAt: string;
}

export interface NegotiationStatusEntry {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
  createdById?: string | null;
}

export interface EscrowTransaction {
  id: string;
  type: string;
  amount: number;
  occurredAt: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EscrowAccountSnapshot {
  id: string;
  status: string;
  expectedAmount: number | null;
  fundedAmount: number;
  releasedAmount: number;
  refundedAmount: number;
  currency: string;
  transactions: EscrowTransaction[];
}

export interface NegotiationContract {
  id: string;
  status: string;
  draftTerms?: string | null;
  documentUrl?: string | null;
  buyerSignedAt?: string | null;
  sellerSignedAt?: string | null;
  finalizedAt?: string | null;
}

export interface NegotiationListingSummary {
  id: string;
  title: string;
  seller_id: string;
  isPremiumWorkflow?: boolean;
}

export interface NegotiationSnapshot {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  initiatedAt: string;
  expiresAt?: string | null;
  agreedPrice?: number | null;
  agreedQuantity?: number | null;
  currency: string;
  notes?: string | null;
  offers: NegotiationOffer[];
  statusHistory: NegotiationStatusEntry[];
  activities: NegotiationActivity[];
  escrowAccount?: EscrowAccountSnapshot | null;
  contract?: NegotiationContract | null;
  listing: NegotiationListingSummary;
}

export interface NegotiationApiResponse {
  negotiation: NegotiationSnapshot;
  message?: string;
}
