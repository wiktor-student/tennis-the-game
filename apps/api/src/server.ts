import { buildApp } from './app';
import { loadConfig } from './config';
import { createDb } from './db';
import { settleClosedPeriods } from './services/leaderboards';
import { VerificationPool } from './verification/pool';

const config = loadConfig();
const db = createDb(config.DATABASE_URL);
const pool = new VerificationPool(config.VERIFY_WORKERS);
const app = await buildApp({ db, pool, config });

// Close finished ranking periods ("Panujący mistrz") every ten minutes.
const settle = () =>
  settleClosedPeriods(db)
    .then((n) => n > 0 && app.log.info({ settled: n }, 'ranking periods settled'))
    .catch((error) => app.log.error(error, 'settlement failed'));
const timer = setInterval(settle, 10 * 60 * 1000);
void settle();

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  clearInterval(timer);
  await app.close();
  await pool.close();
  await db.$disconnect();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ port: config.PORT, host: config.HOST });
