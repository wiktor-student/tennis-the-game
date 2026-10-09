/**
 * End-to-end smoke test against a running API.
 *   API_URL=http://localhost:4000 npx tsx apps/api/scripts/smoke.ts
 *
 * Registers an anonymous player, plays a normal and a daily career with the engine bot,
 * submits them, checks leaderboards, the daily one-attempt rule and tamper rejection.
 */
import { applyAction, createCareer, type Action, type CareerConfig } from '@ttg/engine';
import { botAction } from '../../../packages/engine/src/bot';

const API = process.env.API_URL ?? 'http://localhost:4000';
let token = '';

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: T }> {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: (await res.json()) as T };
}

function play(config: CareerConfig, seed: string): Action[] {
  const state = createCareer(config, seed);
  const actions: Action[] = [];
  for (;;) {
    const a = botAction(state);
    if (!a) break;
    actions.push(a);
    applyAction(state, a);
  }
  return actions;
}

function check(cond: unknown, label: string): void {
  if (!cond) throw new Error(`FAILED: ${label}`);
  console.info(`  ✓ ${label}`);
}

const health = await call<{ status: string }>('GET', '/health');
check(health.json.status === 'ok', 'health');

const auth = await call<{ token: string; player: { displayName: string } }>(
  'POST',
  '/v1/auth/anonymous',
  { displayName: 'Smoke Test' },
);
check(auth.status === 201 && auth.json.token, 'anonymous account created');
token = auth.json.token;

const config: CareerConfig = {
  name: { first: 'Hubert', last: 'Testowy' },
  gender: 'M',
  background: 'academy',
  difficulty: 'normal',
  mode: 'normal',
};
const started = await call<{ careerId: string; seed: string }>('POST', '/v1/careers', {
  mode: 'normal',
  config,
});
check(started.status === 201, 'normal career started with server seed');

const actions = play(config, started.json.seed);
const t0 = performance.now();
const finished = await call<{
  verified: boolean;
  career: { legacy: number };
  positions: { today: number | null };
}>('POST', `/v1/careers/${started.json.careerId}/finish`, { actions });
check(
  finished.status === 200 && finished.json.verified,
  `career verified (${actions.length} actions, ${Math.round(performance.now() - t0)} ms)`,
);
check(
  finished.json.positions.today === 1,
  `leaderboard position today = ${finished.json.positions.today}`,
);

const again = await call('POST', `/v1/careers/${started.json.careerId}/finish`, { actions });
check(again.status === 409, 'double submission rejected');

const second = await call<{ careerId: string; seed: string }>('POST', '/v1/careers', {
  mode: 'normal',
  config,
});
const tampered = play(config, second.json.seed);
tampered.splice(5, 0, { t: 'retire' });
const bad = await call<{ error: string }>('POST', `/v1/careers/${second.json.careerId}/finish`, {
  actions: tampered,
});
check(bad.status === 422 && bad.json.error === 'verification_failed', 'tampered log rejected');

const daily = await call<{ seed: string; config: CareerConfig; attempted: boolean }>(
  'GET',
  '/v1/daily',
);
check(daily.status === 200 && !daily.json.attempted, 'daily career available');
const dailyStart = await call<{ careerId: string; seed: string; config: CareerConfig }>(
  'POST',
  '/v1/careers',
  { mode: 'daily' },
);
check(
  dailyStart.status === 201 && dailyStart.json.seed === daily.json.seed,
  'daily career uses the shared seed',
);
const dailyAgain = await call<{ error: string }>('POST', '/v1/careers', { mode: 'daily' });
check(dailyAgain.status === 409, 'second daily attempt refused');
const dailyDone = await call<{ positions: { daily: number | null } }>(
  'POST',
  `/v1/careers/${dailyStart.json.careerId}/finish`,
  {
    actions: play(dailyStart.json.config, dailyStart.json.seed),
  },
);
check(
  dailyDone.status === 200 && dailyDone.json.positions.daily === 1,
  'daily career verified and ranked',
);

const board = await call<{ entries: { name: string; legacy: number; isMe: boolean }[] }>(
  'GET',
  '/v1/leaderboards?board=today',
);
check(
  board.json.entries.length === 1 && board.json.entries[0]!.isMe,
  'leaderboard shows best career per player',
);

const progress = await call<{ careers: unknown[]; achievements: unknown[] }>(
  'GET',
  '/v1/me/progress',
);
check(
  progress.json.careers.length === 2,
  `museum lists careers (${progress.json.achievements.length} achievements)`,
);

const me = await call<{ streakDays: number }>('GET', '/v1/me');
check(me.json.streakDays === 1, 'streak started');

console.info('\nSmoke test passed.');
