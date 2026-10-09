import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  EngineError,
  EVENTS,
  STAGES,
  TACTICS,
  TOURNAMENTS,
  buildSummary,
  createCareer,
  dailyCareer,
  dailyGoals,
  isoWeekKey,
  overall,
  replay,
  step,
  type CareerState,
} from '../src';
import { config, playCareer, trainPlan } from './helpers';

describe('career creation', () => {
  it('starts an 8-year-old in Tennis 10 at the training screen', () => {
    const state = createCareer(config(), 'new');
    expect(state.player.age).toBe(8);
    expect(state.season.stage).toBe('mini');
    expect(state.phase.kind).toBe('training');
    expect(state.field).toHaveLength(STAGES.mini.fieldSize);
    expect(overall(state.player.skills)).toBeGreaterThan(10);
    expect(overall(state.player.skills)).toBeLessThan(45);
  });

  it('is fully deterministic for a seed', () => {
    expect(createCareer(config(), 'same')).toEqual(createCareer(config(), 'same'));
  });

  it('produces a JSON-serializable state', () => {
    const state = createCareer(config(), 'json');
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe('reducer', () => {
  it('rejects actions that do not fit the phase', () => {
    const state = createCareer(config(), 'reject');
    expect(() => step(state, { t: 'play' })).toThrow(EngineError);
  });

  it('never mutates the input state', () => {
    const state = createCareer(config(), 'immutable');
    const snapshot = JSON.stringify(state);
    step(state, {
      t: 'train',
      plan: trainPlan(['serve', 'serve', 'return', 'forehand', 'mental']),
    });
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('refuses a coach the player has no reputation for', () => {
    let state: CareerState = createCareer(config(), 'coach');
    state = step(state, {
      t: 'train',
      plan: trainPlan(['serve', 'serve', 'return', 'forehand', 'mental']),
    });
    expect(() =>
      step(state, { t: 'team', coach: 'super', physio: false, fitnessCoach: false }),
    ).toThrow(EngineError);
  });
});

describe('full careers', () => {
  const careers = ['alpha', 'bravo', 'charlie'].map((seed, i) =>
    playCareer(
      `career-${seed}`,
      (['wall', 'sponsor_kid', 'academy'] as const)[i],
      i % 2 ? 'F' : 'M',
    ),
  );

  it('always reach retirement within the age limit', () => {
    for (const { state } of careers) {
      expect(state.phase.kind).toBe('retired');
      expect(state.player.age).toBeLessThanOrEqual(39);
      expect(state.history.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('replays to the identical final state (server verification)', () => {
    const { state, actions } = careers[0]!;
    const replayed = replay(state.config, state.seed, actions);
    expect(replayed).toEqual(state);
    expect(buildSummary(replayed).legacy).toBe(buildSummary(state).legacy);
  });

  it('passes through every career stage in order', () => {
    const stages = careers[1]!.state.history.map((h) => h.stage);
    const order = ['mini', 'national', 'europe', 'itf_junior', 'pro'];
    const firstIndex = order.map((s) => stages.indexOf(s as never));
    expect(firstIndex.every((idx) => idx >= 0)).toBe(true);
    expect([...firstIndex].sort((a, b) => a - b)).toEqual(firstIndex);
  });

  it('keeps stats internally consistent', () => {
    for (const { state } of careers) {
      const s = state.stats;
      expect(s.slamSemis).toBeGreaterThanOrEqual(s.slamFinals);
      expect(s.slamQuarters).toBeGreaterThanOrEqual(s.slamSemis);
      expect(s.proMatchesWon).toBeLessThanOrEqual(s.matchesWon);
      expect(s.titles.length).toBeLessThanOrEqual(s.finals);
      const summary = buildSummary(state);
      expect(summary.legacy).toBeGreaterThanOrEqual(0);
      expect(summary.verdict).toBeTruthy();
    }
  });
});

describe('content integrity', () => {
  it('has unique ids', () => {
    const unique = (ids: string[]) => new Set(ids).size === ids.length;
    expect(unique(EVENTS.map((e) => e.id))).toBe(true);
    expect(unique(TACTICS.map((t) => t.id))).toBe(true);
    expect(unique(ACHIEVEMENTS.map((a) => a.id))).toBe(true);
    expect(Object.keys(TOURNAMENTS).length).toBeGreaterThan(150);
  });

  it('balances [[m|f]] markers and gives every option text in both locales', () => {
    const texts: string[] = [];
    for (const e of EVENTS) {
      texts.push(e.text.pl, e.text.en);
      for (const o of e.options) texts.push(o.label.pl, o.label.en, o.result.pl, o.result.en);
    }
    for (const t of TACTICS) texts.push(t.name.pl, t.name.en, t.motto.pl, t.description.en);
    for (const t of texts) {
      expect(t.length).toBeGreaterThan(0);
      expect((t.match(/\[\[/g) ?? []).length).toBe((t.match(/\]\]/g) ?? []).length);
    }
  });
});

describe('meta', () => {
  it('daily career and goals are stable for a day', () => {
    expect(dailyCareer('2026-10-09')).toEqual(dailyCareer('2026-10-09'));
    expect(dailyCareer('2026-10-09').seed).not.toBe(dailyCareer('2026-10-10').seed);
    expect(dailyGoals('2026-10-09')).toHaveLength(3);
  });

  it('computes ISO week keys', () => {
    expect(isoWeekKey('2026-10-09')).toBe('2026-W41');
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53');
  });
});
