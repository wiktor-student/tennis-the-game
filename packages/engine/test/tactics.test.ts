import { describe, expect, it } from 'vitest';
import {
  EngineError,
  STARTER_TACTICS,
  TACTICS,
  createCareer,
  learnableTactics,
  step,
  tacticEdge,
  trainingBlocks,
  type CareerState,
} from '../src';
import { blocksGain } from '../src/sim/tactics';
import { config, playCareer, trainPlan } from './helpers';

describe('tactic cards', () => {
  const state = createCareer(config(), 'tactics');

  it('starts with the three starter cards', () => {
    expect(state.tactics.owned).toEqual(STARTER_TACTICS);
    expect(STARTER_TACTICS).toHaveLength(3);
  });

  it('rewards matching the card to the opponent style and surface', () => {
    const svGrass = tacticEdge(state, 'big_serve', { style: 'grinder' }, 'grass').edge;
    const svClay = tacticEdge(state, 'big_serve', { style: 'server' }, 'clay').edge;
    expect(svGrass).toBeGreaterThan(svClay);
  });

  it('keeps every edge within the cap', () => {
    for (const t of TACTICS) {
      for (const style of ['server', 'grinder', 'allround', 'netrusher'] as const) {
        const { edge } = tacticEdge(state, t.id, { style }, 'grass');
        expect(Math.abs(edge)).toBeLessThanOrEqual(0.05);
      }
    }
  });

  it('only the current coach teaches new cards', () => {
    expect(learnableTactics(state)).toEqual([]); // dad teaches nothing
    const club: CareerState = { ...state, team: { ...state.team, coach: 'club' } };
    expect(learnableTactics(club)).toEqual(['grind']);
  });
});

describe('block training', () => {
  const state = createCareer(config(), 'blocks');

  it('requires spending exactly the available blocks', () => {
    expect(trainingBlocks(state)).toBe(5);
    expect(() => step(state, { t: 'train', plan: trainPlan(['serve', 'serve']) })).toThrow(
      EngineError,
    );
  });

  it('has diminishing returns on a single skill', () => {
    expect(blocksGain(state, 'serve', 5)).toBeLessThan(blocksGain(state, 'serve', 1) * 5);
  });

  it('rest blocks lower fatigue and lift morale', () => {
    const tired: CareerState = { ...state, player: { ...state.player, fatigue: 40 } };
    const next = step(tired, {
      t: 'train',
      plan: { skills: { serve: 3 }, rest: 2, learn: null, preferred: 'baseline' },
    });
    expect(next.player.fatigue).toBe(28);
    expect(next.player.morale).toBeGreaterThan(tired.player.morale);
    expect(next.season.restBlocks).toBe(2);
  });
});

describe('tactics in careers', () => {
  it('pauses key matches for a scouting report and records card use', () => {
    const { state } = playCareer('tactic-career', 'academy', 'F');
    expect(state.stats.keyMatchesWon).toBeGreaterThan(0);
    expect(Object.values(state.tactics.record).reduce((n, r) => n + r.played, 0)).toBeGreaterThan(
      50,
    );
    expect(state.tactics.owned.length).toBeGreaterThan(3);
  });
});
