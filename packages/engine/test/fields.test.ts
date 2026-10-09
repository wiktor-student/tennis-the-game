import { describe, expect, it } from 'vitest';
import { TOURNAMENTS, applyAction, createCareer, type CareerState } from '../src';
import { botAction } from '../src/bot';
import { Rng } from '../src/rng';
import { aiById } from '../src/sim/field';
import { tournamentOutlook, winChance } from '../src/sim/outlook';
import { FIELD_BAND, assignWeek, juniorEntrants } from '../src/sim/tournament';
import { config } from './helpers';

function proState(seed: string): CareerState {
  const state = createCareer(config({ background: 'academy' }), seed);
  for (let i = 0; i < 20_000 && state.season.stage !== 'pro'; i++) {
    const action = botAction(state);
    if (!action) break;
    applyAction(state, action);
  }
  return state;
}

const byLevel = (level: string) => {
  const def = Object.values(TOURNAMENTS).find((t) => t.level === level);
  if (!def) throw new Error(level);
  return def;
};

describe('tournament fields', () => {
  it('keeps the top of the tour out of ITF events and fills them with locals', () => {
    const state = proState('fields-itf');
    const itf = byLevel('itf15');
    const gs = byLevel('gs');
    const { byEvent } = assignWeek(state, Rng.fromSeed('w'), [gs, itf], new Set());
    const entrants = byEvent.get(itf.id) ?? [];
    expect(entrants).toHaveLength(32);
    const ai = aiById(state);
    const tracked = new Set(state.field.map((a) => a.id));
    const fromPool = entrants.filter((id) => tracked.has(id));
    const [minRank, , maxTracked] = FIELD_BAND.itf15 as [number, number, number];
    expect(fromPool.length).toBeLessThanOrEqual(maxTracked);
    for (const id of entrants)
      expect(ai.get(id)?.rank ?? 9999).toBeGreaterThanOrEqual(minRank * 0.8);
  });

  it('gives championships a stronger junior field than local events', () => {
    const state = createCareer(config(), 'fields-junior');
    const local = byLevel('j_mini');
    const champs = byLevel('j_mini_pl');
    const ai = aiById(state);
    const mean = (ids: string[]) =>
      ids.reduce((n, id) => n + (ai.get(id)?.rating ?? 0), 0) / ids.length;
    let localSum = 0;
    let champsSum = 0;
    for (let i = 0; i < 20; i++) {
      localSum += mean(juniorEntrants(state, Rng.fromSeed(`l${i}`), local, true));
      champsSum += mean(juniorEntrants(state, Rng.fromSeed(`c${i}`), champs, true));
    }
    expect(champsSum / 20).toBeGreaterThan(localSum / 20 + 2);
  });
});

describe('tournament outlook', () => {
  it('maps rating gaps to sensible win chances', () => {
    expect(winChance(0)).toBeCloseTo(0.5);
    expect(winChance(6)).toBeGreaterThan(0.7);
    expect(winChance(-12)).toBeLessThan(0.15);
  });

  it('rates a local junior event easier than the national championship', () => {
    const state = createCareer(config(), 'outlook');
    const local = tournamentOutlook(state, byLevel('j_mini'));
    const champs = tournamentOutlook(state, byLevel('j_mini_pl'));
    expect(local.first).toBeGreaterThan(champs.first);
    expect(local.opp).toBeLessThan(champs.opp);
  });

  it('marks events the player cannot enter as closed', () => {
    const state = proState('outlook-pro');
    state.pro.rank = 2000;
    const finals = tournamentOutlook(state, byLevel('finals'));
    expect(finals.verdict).toBe('closed');
    expect(finals.first).toBe(0);
  });
});
