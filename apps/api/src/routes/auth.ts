import { AuthResponseSchema, UpdateMeSchema, type AuthResponse } from '@ttg/shared';
import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { parse, requirePlayer } from '../http';
import { defaultDisplayName, hashToken, newToken } from '../lib/tokens';
import { playerDto } from '../services/serializers';

const AnonymousSchema = z.object({ displayName: UpdateMeSchema.shape.displayName }).partial();

export const authRoutes =
  ({ db }: AppDeps): FastifyPluginAsync =>
  async (app) => {
    /** Create an anonymous account. The token is shown once and stored only as a hash. */
    app.post(
      '/v1/auth/anonymous',
      { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
      async (request, reply) => {
        const body = parse(AnonymousSchema, request.body ?? {});
        const token = newToken();
        const player = await db.player.create({
          data: {
            displayName: body.displayName ?? defaultDisplayName(),
            tokenHash: hashToken(token),
          },
        });
        const response: AuthResponse = AuthResponseSchema.parse({
          token,
          player: playerDto(player),
        });
        return reply.status(201).send(response);
      },
    );

    app.get('/v1/me', async (request) => playerDto(requirePlayer(request)));

    app.patch('/v1/me', async (request) => {
      const player = requirePlayer(request);
      const body = parse(UpdateMeSchema, request.body);
      const updated = await db.player.update({
        where: { id: player.id },
        data: {
          ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
          ...(body.locale !== undefined ? { locale: body.locale } : {}),
          ...(body.selectedRacket !== undefined ? { selectedRacket: body.selectedRacket } : {}),
        },
      });
      return playerDto(updated);
    });
  };
