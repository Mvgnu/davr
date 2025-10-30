'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

import { DealDisputeStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import {
  applyDisputeEscrowHold,
  assignDealDispute,
  recordDisputeCounterProposal,
  settleDisputeEscrowPayout,
  transitionDealDisputeStatus,
} from '@/lib/disputes/service';
import { triggerJob } from '@/lib/jobs/scheduler';
import type { TriggerJobActionState } from '@/types/scheduler';

const DEFAULT_ERROR: TriggerJobActionState = {
  status: 'error',
  jobName: null,
  message: 'Job konnte nicht ausgeführt werden.',
  code: 'EXECUTION_FAILED',
};

export interface DisputeActionState {
  status: 'idle' | 'success' | 'error';
  disputeId: string | null;
  message: string;
  code: 'FORBIDDEN' | 'VALIDATION_FAILED' | 'UPDATED' | 'EXECUTION_FAILED';
}

const DEFAULT_DISPUTE_ERROR: DisputeActionState = {
  status: 'error',
  disputeId: null,
  message: 'Aktion konnte nicht ausgeführt werden.',
  code: 'EXECUTION_FAILED',
};

export async function triggerJobAction(
  _prevState: TriggerJobActionState,
  formData: FormData
): Promise<TriggerJobActionState> {
  const jobNameValue = formData.get('jobName');

  if (typeof jobNameValue !== 'string' || jobNameValue.trim().length === 0) {
    return {
      status: 'error',
      jobName: null,
      message: 'Job-Name ist erforderlich.',
      code: 'JOB_NAME_REQUIRED',
    };
  }

  const jobName = jobNameValue.trim();
  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');

  if (!isAdmin) {
    return {
      status: 'error',
      jobName,
      message: 'Keine Berechtigung für manuelle Scheduler-Trigger.',
      code: 'FORBIDDEN',
    };
  }

  try {
    await triggerJob(jobName);
    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'success',
      jobName,
      message: 'Job wurde gestartet und läuft im Hintergrund.',
      code: 'TRIGGERED',
    };
  } catch (error) {
    const fallbackMessage = DEFAULT_ERROR.message;
    const derivedMessage = error instanceof Error ? error.message : fallbackMessage;

    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'error',
      jobName,
      message: derivedMessage || fallbackMessage,
      code: 'EXECUTION_FAILED',
    };
  }
}

function isValidDisputeStatus(value: string): value is DealDisputeStatus {
  return Object.values(DealDisputeStatus).includes(value as DealDisputeStatus);
}

export async function updateDisputeStatusAction(
  _prevState: DisputeActionState,
  formData: FormData
): Promise<DisputeActionState> {
  const disputeIdValue = formData.get('disputeId');
  const statusValue = formData.get('targetStatus');
  const noteValue = formData.get('note');

  if (typeof disputeIdValue !== 'string' || disputeIdValue.trim().length === 0) {
    return {
      status: 'error',
      disputeId: null,
      message: 'Dispute-ID ist erforderlich.',
      code: 'VALIDATION_FAILED',
    };
  }

  if (typeof statusValue !== 'string' || !isValidDisputeStatus(statusValue)) {
    return {
      status: 'error',
      disputeId: disputeIdValue,
      message: 'Ungültiger Statusübergang.',
      code: 'VALIDATION_FAILED',
    };
  }

  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');
  const actorUserId = typeof session?.user?.id === 'string' ? session.user.id : null;

  if (!isAdmin) {
    return {
      status: 'error',
      disputeId: disputeIdValue,
      message: 'Keine Berechtigung für Dispute-Aktionen.',
      code: 'FORBIDDEN',
    };
  }

  try {
    await transitionDealDisputeStatus({
      disputeId: disputeIdValue,
      targetStatus: statusValue,
      actorUserId,
      note: typeof noteValue === 'string' ? noteValue : null,
    });

    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'success',
      disputeId: disputeIdValue,
      message: 'Dispute aktualisiert.',
      code: 'UPDATED',
    };
  } catch (error) {
    const derivedMessage = error instanceof Error ? error.message : DEFAULT_DISPUTE_ERROR.message;

    revalidatePath('/app/admin/deals/operations');

    return {
      ...DEFAULT_DISPUTE_ERROR,
      disputeId: disputeIdValue,
      message: derivedMessage || DEFAULT_DISPUTE_ERROR.message,
    };
  }
}

export async function assignDisputeAction(
  _prevState: DisputeActionState,
  formData: FormData
): Promise<DisputeActionState> {
  const disputeIdValue = formData.get('disputeId');
  const assigneeValue = formData.get('assigneeUserId');

  if (typeof disputeIdValue !== 'string' || disputeIdValue.trim().length === 0) {
    return {
      status: 'error',
      disputeId: null,
      message: 'Dispute-ID ist erforderlich.',
      code: 'VALIDATION_FAILED',
    };
  }

  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');
  const actorUserId = typeof session?.user?.id === 'string' ? session.user.id : null;

  if (!isAdmin) {
    return {
      status: 'error',
      disputeId: disputeIdValue,
      message: 'Keine Berechtigung für Dispute-Aktionen.',
      code: 'FORBIDDEN',
    };
  }

  const assigneeId = typeof assigneeValue === 'string' && assigneeValue.length > 0 ? assigneeValue : null;

  try {
    await assignDealDispute({
      disputeId: disputeIdValue,
      assigneeUserId: assigneeId,
      actorUserId,
    });

    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'success',
      disputeId: disputeIdValue,
      message: assigneeId ? 'Dispute zugewiesen.' : 'Dispute-Zuweisung entfernt.',
      code: 'UPDATED',
    };
  } catch (error) {
    const derivedMessage = error instanceof Error ? error.message : DEFAULT_DISPUTE_ERROR.message;

    revalidatePath('/app/admin/deals/operations');

    return {
      ...DEFAULT_DISPUTE_ERROR,
      disputeId: disputeIdValue,
      message: derivedMessage || DEFAULT_DISPUTE_ERROR.message,
    };
  }
}

function parseAmount(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function applyDisputeHoldAction(
  _prevState: DisputeActionState,
  formData: FormData
): Promise<DisputeActionState> {
  const disputeIdValue = formData.get('disputeId');
  const amountValue = parseAmount(formData.get('amount'));
  const reasonValue = formData.get('reason');

  if (typeof disputeIdValue !== 'string' || disputeIdValue.trim().length === 0 || amountValue === null) {
    return {
      status: 'error',
      disputeId: typeof disputeIdValue === 'string' ? disputeIdValue : null,
      message: 'Gültige Dispute-ID und Betrag erforderlich.',
      code: 'VALIDATION_FAILED',
    };
  }

  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');
  const actorUserId = typeof session?.user?.id === 'string' ? session.user.id : null;

  if (!isAdmin) {
    return {
      status: 'error',
      disputeId: disputeIdValue,
      message: 'Keine Berechtigung für Treuhand-Aktionen.',
      code: 'FORBIDDEN',
    };
  }

  try {
    await applyDisputeEscrowHold({
      disputeId: disputeIdValue,
      actorUserId,
      amount: amountValue,
      reason: typeof reasonValue === 'string' ? reasonValue : null,
    });

    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'success',
      disputeId: disputeIdValue,
      message: 'Treuhand-Hold registriert.',
      code: 'UPDATED',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : DEFAULT_DISPUTE_ERROR.message;
    revalidatePath('/app/admin/deals/operations');
    return {
      ...DEFAULT_DISPUTE_ERROR,
      disputeId: disputeIdValue,
      message,
    };
  }
}

export async function recordDisputeCounterProposalAction(
  _prevState: DisputeActionState,
  formData: FormData
): Promise<DisputeActionState> {
  const disputeIdValue = formData.get('disputeId');
  const amountValue = parseAmount(formData.get('amount'));
  const noteValue = formData.get('note');

  if (typeof disputeIdValue !== 'string' || disputeIdValue.trim().length === 0 || amountValue === null) {
    return {
      status: 'error',
      disputeId: typeof disputeIdValue === 'string' ? disputeIdValue : null,
      message: 'Gültige Dispute-ID und Betrag erforderlich.',
      code: 'VALIDATION_FAILED',
    };
  }

  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');
  const actorUserId = typeof session?.user?.id === 'string' ? session.user.id : null;

  if (!isAdmin) {
    return {
      status: 'error',
      disputeId: disputeIdValue,
      message: 'Keine Berechtigung für Treuhand-Aktionen.',
      code: 'FORBIDDEN',
    };
  }

  try {
    await recordDisputeCounterProposal({
      disputeId: disputeIdValue,
      actorUserId,
      amount: amountValue,
      note: typeof noteValue === 'string' ? noteValue : null,
    });

    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'success',
      disputeId: disputeIdValue,
      message: 'Vergleichsvorschlag gespeichert.',
      code: 'UPDATED',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : DEFAULT_DISPUTE_ERROR.message;
    revalidatePath('/app/admin/deals/operations');
    return {
      ...DEFAULT_DISPUTE_ERROR,
      disputeId: disputeIdValue,
      message,
    };
  }
}

export async function settleDisputePayoutAction(
  _prevState: DisputeActionState,
  formData: FormData
): Promise<DisputeActionState> {
  const disputeIdValue = formData.get('disputeId');
  const amountValue = parseAmount(formData.get('amount'));
  const directionValue = formData.get('direction');
  const noteValue = formData.get('note');

  if (
    typeof disputeIdValue !== 'string' ||
    disputeIdValue.trim().length === 0 ||
    amountValue === null ||
    (typeof directionValue !== 'string' ||
      (directionValue !== 'RELEASE_TO_SELLER' && directionValue !== 'REFUND_TO_BUYER'))
  ) {
    return {
      status: 'error',
      disputeId: typeof disputeIdValue === 'string' ? disputeIdValue : null,
      message: 'Gültige Angaben erforderlich.',
      code: 'VALIDATION_FAILED',
    };
  }

  const session = await getServerSession(authOptions);
  const isAdmin = Boolean(session?.user?.isAdmin || session?.user?.role === 'ADMIN');
  const actorUserId = typeof session?.user?.id === 'string' ? session.user.id : null;

  if (!isAdmin) {
    return {
      status: 'error',
      disputeId: disputeIdValue,
      message: 'Keine Berechtigung für Treuhand-Aktionen.',
      code: 'FORBIDDEN',
    };
  }

  try {
    await settleDisputeEscrowPayout({
      disputeId: disputeIdValue,
      actorUserId,
      amount: amountValue,
      direction: directionValue,
      note: typeof noteValue === 'string' ? noteValue : null,
    });

    revalidatePath('/app/admin/deals/operations');

    return {
      status: 'success',
      disputeId: disputeIdValue,
      message: 'Auszahlung dokumentiert.',
      code: 'UPDATED',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : DEFAULT_DISPUTE_ERROR.message;
    revalidatePath('/app/admin/deals/operations');
    return {
      ...DEFAULT_DISPUTE_ERROR,
      disputeId: disputeIdValue,
      message,
    };
  }
}
