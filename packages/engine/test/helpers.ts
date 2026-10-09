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
