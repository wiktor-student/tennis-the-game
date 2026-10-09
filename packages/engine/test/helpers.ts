import type { SkillId, TrainingPlan } from '../src';
import {
  applyAction,
  createCareer,
  type Action,
  type BackgroundId,
  type CareerConfig,
  type CareerState,
} from '../src';
import { botAction } from '../src/bot';

export function config(overrides: Partial<CareerConfig> = {}): CareerConfig {
  return {
    name: { first: 'Iga', last: 'Testowa' },
    gender: 'F',
    background: 'wall',
    difficulty: 'normal',
    mode: 'normal',
    ...overrides,
  };
}

/** Play a whole career with the bot; returns the final state and the action log. */
export function playCareer(
  seed: string,
  background: BackgroundId = 'wall',
  gender: 'M' | 'F' = 'M',
): {
  state: CareerState;
  actions: Action[];
} {
  const cfg = config({ background, gender });
  const state = createCareer(cfg, seed);
  const actions: Action[] = [];
  for (let i = 0; i < 20_000; i++) {
    const action = botAction(state);
    if (!action) break;
    actions.push(action);
    applyAction(state, action);
  }
  return { state, actions };
}

/** Training plan from a list of block assignments (5 blocks for a starting career). */
export function trainPlan(blocks: SkillId[], preferred = 'baseline'): TrainingPlan {
  const skills: Partial<Record<SkillId, number>> = {};
  for (const id of blocks) skills[id] = (skills[id] ?? 0) + 1;
  return { skills, rest: 0, learn: null, preferred };
}
