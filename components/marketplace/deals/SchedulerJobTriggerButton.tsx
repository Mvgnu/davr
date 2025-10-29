'use client';

import { useEffect, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { TriggerJobActionState } from '@/types/scheduler';

const INITIAL_STATE: TriggerJobActionState = {
  status: 'idle',
  jobName: null,
  message: null,
  code: null,
};

interface SchedulerJobTriggerButtonProps {
  jobName: string;
  action: (state: TriggerJobActionState, formData: FormData) => Promise<TriggerJobActionState>;
  onStateChange?: (state: TriggerJobActionState) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" variant="outline" type="submit" disabled={pending}>
      {pending ? 'Wird gestartet…' : 'Jetzt ausführen'}
    </Button>
  );
}

export function SchedulerJobTriggerButton({ jobName, action, onStateChange }: SchedulerJobTriggerButtonProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      router.refresh();
    }

    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange, router]);

  const feedback = useMemo(() => {
    if (state.status === 'idle' || state.jobName !== jobName) {
      return null;
    }

    const tone = state.status === 'error' ? 'text-destructive' : 'text-muted-foreground';
    return (
      <p className={`text-xs ${tone}`} data-status={state.status}>
        {state.message}
      </p>
    );
  }, [jobName, state.jobName, state.message, state.status]);

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="jobName" value={jobName} />
      <SubmitButton />
      {feedback}
    </form>
  );
}
