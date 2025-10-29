'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import { triggerJob } from '@/lib/jobs/scheduler';
import type { TriggerJobActionState } from '@/types/scheduler';

const DEFAULT_ERROR: TriggerJobActionState = {
  status: 'error',
  jobName: null,
  message: 'Job konnte nicht ausgeführt werden.',
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
