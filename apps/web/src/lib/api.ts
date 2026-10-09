import {
  AuthResponseSchema,
  DailyResponseSchema,
  FinishCareerResponseSchema,
  LeaderboardResponseSchema,
  PlayerSchema,
  ProgressResponseSchema,
  StartCareerResponseSchema,
  type ActionDto,
  type Board,
  type StartCareerBody,
  type UpdateMeBody,
} from '@ttg/shared';
import type { ZodType, z } from 'zod';
import { load, save } from './storage';

/**
 * Thin, typed API client. Every response is validated against the shared contract. When no
 * API URL is configured the game runs fully offline.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export const apiEnabled = BASE.length > 0;

export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

let token: string | null = load<string | null>('token', null);

async function request<S extends ZodType>(
  schema: S,
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<z.infer<S>> {
  if (!apiEnabled) throw new ApiFailure(0, 'offline', 'API disabled');
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiFailure(0, 'network', 'Network error');
  }
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    details?: unknown;
  };
  if (!res.ok)
    throw new ApiFailure(
      res.status,
      json.error ?? 'error',
      json.message ?? res.statusText,
      json.details,
    );
  return schema.parse(json);
}

/** Ensure an anonymous account exists; returns false when the API is unreachable. */
export async function ensureSession(): Promise<boolean> {
  if (!apiEnabled) return false;
  if (token) return true;
  try {
    const auth = await request(AuthResponseSchema, '/v1/auth/anonymous', {
      method: 'POST',
      body: {},
    });
    token = auth.token;
    save('token', token);
    return true;
  } catch {
    return false;
  }
}

export function forgetSession(): void {
  token = null;
  save('token', null);
}

export const api = {
  me: () => request(PlayerSchema, '/v1/me'),
  updateMe: (body: UpdateMeBody) => request(PlayerSchema, '/v1/me', { method: 'PATCH', body }),
  daily: () => request(DailyResponseSchema, '/v1/daily'),
  leaderboard: (board: Board, limit = 10) =>
    request(LeaderboardResponseSchema, `/v1/leaderboards?board=${board}&limit=${limit}`),
  startCareer: (body: StartCareerBody) =>
    request(StartCareerResponseSchema, '/v1/careers', { method: 'POST', body }),
  finishCareer: (id: string, actions: ActionDto[]) =>
    request(FinishCareerResponseSchema, `/v1/careers/${encodeURIComponent(id)}/finish`, {
      method: 'POST',
      body: { actions },
    }),
  progress: () => request(ProgressResponseSchema, '/v1/me/progress'),
};
