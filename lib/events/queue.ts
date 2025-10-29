/**
 * meta: module=negotiation-events subsystem=queue-dispatcher version=0.1 owner=platform
 * Lightweight queue abstraction so negotiation lifecycle events can be
 * forwarded to background processors once infrastructure is connected. The
 * in-memory queue array doubles as an inspection hook for tests and the admin
 * console activity feed bootstrap.
 */
export interface NegotiationQueueEnvelope {
  type: string;
  negotiationId: string;
  triggeredBy: string | null;
  status?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  audience: string;
}

const queueBuffer: NegotiationQueueEnvelope[] = [];

export function getNegotiationQueueBuffer() {
  return queueBuffer;
}

export async function enqueueNegotiationLifecycleEvent(envelope: NegotiationQueueEnvelope) {
  queueBuffer.push(envelope);
}
