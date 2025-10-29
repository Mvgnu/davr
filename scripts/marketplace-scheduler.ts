/* eslint-disable no-console */
import 'dotenv/config';

import { registerMarketplaceJobs } from '@/lib/jobs/registry';
import { runDueJobs, startScheduler, stopScheduler } from '@/lib/jobs/scheduler';

async function bootstrap() {
  registerMarketplaceJobs();
  await runDueJobs();
  startScheduler();
  console.log('Marketplace scheduler initialisiert und gestartet.');
}

bootstrap().catch((error) => {
  console.error('Scheduler konnte nicht gestartet werden', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  stopScheduler();
  console.log('Scheduler gestoppt.');
  process.exit(0);
});
