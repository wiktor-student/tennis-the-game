import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ENGINE_VERSION } from '@ttg/engine';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config';
import type { Db } from './db';
import { HttpError } from './http';
import { hashToken } from './lib/tokens';
import { authRoutes } from './routes/auth';
import { boardRoutes } from './routes/boards';
import { careerRoutes } from './routes/careers';
import type { VerificationPool } from './verification/pool';

export interface AppDeps {
  db: Db;
  pool: VerificationPool;
  config: Config;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: deps.config.LOG_LEVEL,
      redact: ['req.headers.authorization'],
      ...(deps.config.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : {}),
    },
    trustProxy: true,
    bodyLimit: 256 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: deps.config.CORS_ORIGINS, methods: ['GET', 'POST', 'PATCH'] });
  await app.register(rateLimit, { max: 240, timeWindow: '1 minute' });

  // Bearer-token authentication. Anonymous requests continue with `request.player = null`.
  app.decorateRequest('player', null);
  app.addHook('onRequest', async (request) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return;
    const token = header.slice(7).trim();
    if (token.length < 20 || token.length > 100) return;
    const player = await deps.db.player.findUnique({ where: { tokenHash: hashToken(token) } });
    if (player) {
      request.player = player;
      if (Date.now() - player.lastSeenAt.getTime() > 3_600_000) {
        void deps.db.player
          .update({ where: { id: player.id }, data: { lastSeenAt: new Date() } })
          .catch(() => undefined);
      }
    }
  });

  app.setErrorHandler(
    (error: Error & { statusCode?: number; validation?: unknown }, request, reply) => {
      if (error instanceof HttpError) {
        return reply
          .status(error.status)
          .send({ error: error.code, message: error.message, details: error.details });
      }
      if (error.statusCode === 429) {
        return reply.status(429).send({ error: 'rate_limited', message: 'Too many requests' });
      }
      if (error.validation || error.statusCode === 400 || error.statusCode === 413) {
        return reply
          .status(error.statusCode ?? 400)
          .send({ error: 'bad_request', message: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({ error: 'internal_error', message: 'Internal server error' });
    },
  );

  app.get('/health', async () => ({
    status: 'ok',
    engine: ENGINE_VERSION,
    queue: deps.pool.pending,
  }));
  app.get('/health/db', async () => {
    await deps.db.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  });

  await app.register(authRoutes(deps));
  await app.register(careerRoutes(deps));
  await app.register(boardRoutes(deps));
  return app;
}
