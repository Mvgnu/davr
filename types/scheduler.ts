// meta: module=types/scheduler state=stable responsibility=job-trigger-feedback
export type TriggerJobActionCode =
  | 'JOB_NAME_REQUIRED'
  | 'FORBIDDEN'
  | 'TRIGGERED'
  | 'EXECUTION_FAILED'
  | null;

export interface TriggerJobActionState {
  status: 'idle' | 'success' | 'error';
  jobName: string | null;
  message: string | null;
  code: TriggerJobActionCode;
}
