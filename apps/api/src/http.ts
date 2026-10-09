import type { Player } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodType, z } from 'zod';

declare module 'fastify' {
  interface FastifyRequest {
    player: Player | null;
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function parse<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new HttpError(400, 'validation_error', 'Invalid request', result.error.flatten());
  return result.data;
}

export function requirePlayer(request: FastifyRequest): Player {
  if (!request.player) throw new HttpError(401, 'unauthorized', 'Missing or invalid token');
  return request.player;
}

export function send<T>(reply: FastifyReply, status: number, body: T): FastifyReply {
  return reply.status(status).send(body);
}
