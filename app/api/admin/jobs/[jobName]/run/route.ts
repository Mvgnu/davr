import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth/options';
import { triggerJob } from '@/lib/jobs/scheduler';

/**
 * meta: route=admin-job-runner version=0.1 owner=platform
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { jobName: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin && session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    await triggerJob(params.jobName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Job konnte nicht ausgeführt werden';
    return NextResponse.json({ error: 'JOB_FAILED', message }, { status: 500 });
  }
}
