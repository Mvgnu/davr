import type { TriggerJobActionState } from '@/types/scheduler';

const revalidatePathMock = jest.fn();
jest.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

const getServerSessionMock = jest.fn();
jest.mock('next-auth/next', () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

const triggerJobMock = jest.fn();
jest.mock('@/lib/jobs/scheduler', () => ({
  triggerJob: (...args: unknown[]) => triggerJobMock(...args),
}));

describe('triggerJobAction server action', () => {
  const { triggerJobAction } = require('@/app/admin/deals/operations/actions');

  const initialState: TriggerJobActionState = {
    status: 'idle',
    jobName: null,
    message: null,
    code: null,
  };

  beforeEach(() => {
    revalidatePathMock.mockClear();
    triggerJobMock.mockClear();
    getServerSessionMock.mockReset();
  });

  it('rejects missing job names', async () => {
    const formData = new FormData();

    const result = await triggerJobAction(initialState, formData);

    expect(result).toEqual(
      expect.objectContaining({ status: 'error', code: 'JOB_NAME_REQUIRED', jobName: null })
    );
    expect(triggerJobMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('requires admin permissions', async () => {
    const formData = new FormData();
    formData.set('jobName', 'fanout');

    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER', isAdmin: false } });

    const result = await triggerJobAction(initialState, formData);

    expect(result).toEqual(
      expect.objectContaining({ status: 'error', code: 'FORBIDDEN', jobName: 'fanout' })
    );
    expect(triggerJobMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('triggers jobs and reports success', async () => {
    const formData = new FormData();
    formData.set('jobName', 'watchdog');

    getServerSessionMock.mockResolvedValue({ user: { id: 'admin', role: 'ADMIN', isAdmin: true } });

    const result = await triggerJobAction(initialState, formData);

    expect(triggerJobMock).toHaveBeenCalledWith('watchdog');
    expect(revalidatePathMock).toHaveBeenCalledWith('/app/admin/deals/operations');
    expect(result).toEqual(
      expect.objectContaining({ status: 'success', code: 'TRIGGERED', jobName: 'watchdog' })
    );
  });

  it('propagates failures as error state', async () => {
    const formData = new FormData();
    formData.set('jobName', 'reconciliation');

    getServerSessionMock.mockResolvedValue({ user: { id: 'admin', role: 'ADMIN', isAdmin: true } });
    triggerJobMock.mockRejectedValueOnce(new Error('kaputt'));

    const result = await triggerJobAction(initialState, formData);

    expect(triggerJobMock).toHaveBeenCalledWith('reconciliation');
    expect(result).toEqual(
      expect.objectContaining({ status: 'error', code: 'EXECUTION_FAILED', message: 'kaputt', jobName: 'reconciliation' })
    );
  });
});
