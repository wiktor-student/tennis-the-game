import {
  ENGINE_VERSION,
  EngineError,
  applyAction,
  buildSummary,
  createCareer,
  evaluateAchievements,
  type Action,
  type CareerConfig,
  type CareerSummary,
} from '@ttg/engine';

export interface VerifyInput {
  config: CareerConfig;
  seed: string;
  engineVersion: string;
  actions: Action[];
}

export type VerifyResult =
  | { ok: true; summary: CareerSummary; achievements: string[]; actionCount: number }
  | { ok: false; reason: string };

/**
 * Replays a submitted action log from the server-issued seed. A career is accepted only if
 * every action is legal and the log ends exactly at retirement.
 */
export function verifyCareer(input: VerifyInput): VerifyResult {
  if (input.engineVersion !== ENGINE_VERSION) {
    return { ok: false, reason: `engine_version_mismatch:${input.engineVersion}->${ENGINE_VERSION}` };
  }
  const state = createCareer(input.config, input.seed);
  for (let i = 0; i < input.actions.length; i++) {
    if (state.phase.kind === 'retired') return { ok: false, reason: `actions_after_retirement:${i}` };
    try {
      applyAction(state, input.actions[i] as Action);
    } catch (error) {
      const message = error instanceof EngineError ? error.message : 'engine_failure';
      return { ok: false, reason: `illegal_action:${i}:${message}`.slice(0, 200) };
    }
  }
  if (state.phase.kind !== 'retired') return { ok: false, reason: 'career_not_finished' };
  const summary = buildSummary(state, state.phase.reason);
  return { ok: true, summary, achievements: evaluateAchievements(summary), actionCount: input.actions.length };
}
