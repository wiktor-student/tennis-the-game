import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rng';
import {
  continueMatch,
  holdProbability,
  matchWinner,
  playerCompetitor,
  quickMatch,
  scoreText,
  servePointProbability,
  type MatchSetup,
} from '../src/sim/match';
import type { SetScore, Skills } from '../src';

const flat = (v: number): Skills => ({
  serve: v,
  return: v,
  forehand: v,
  backhand: v,
  net: v,
  fitness: v,
  mental: v,
});

function setup(a: number, b: number, bestOf: 3 | 5 = 3): MatchSetup {
  return {
    a: playerCompetitor(flat(a), 70, false, 0),
    b: playerCompetitor(flat(b), 70, false, 0),
    surface: 'hard',
    bestOf,
    decidingTiebreak10: false,
  };
}

function validSet(s: SetScore): boolean {
  const hi = Math.max(s.a, s.b);
  const lo = Math.min(s.a, s.b);
  if (hi === 6) return lo <= 4 && s.tb === null;
  if (hi === 7) return (lo === 5 && s.tb === null) || (lo === 6 && s.tb !== null);
  return false;
}

describe('match model', () => {
  it('hold probability is monotonic and ~0.8 at p=0.62', () => {
    expect(holdProbability(0.5)).toBeCloseTo(0.5, 5);
    expect(holdProbability(0.62)).toBeGreaterThan(0.75);
    expect(holdProbability(0.7)).toBeGreaterThan(holdProbability(0.62));
  });

  it('serve probability favours the stronger server and grass over clay', () => {
    const strong = playerCompetitor(flat(85), 70, false, 0);
    const weak = playerCompetitor(flat(70), 70, false, 0);
    expect(servePointProbability(strong, weak, 'hard', false)).toBeGreaterThan(
      servePointProbability(weak, strong, 'hard', false),
    );
    expect(servePointProbability(strong, strong, 'grass', false)).toBeGreaterThan(
      servePointProbability(strong, strong, 'clay', false),
    );
  });

  it('produces only legal set scores', () => {
    const rng = Rng.fromSeed('legal');
    for (let i = 0; i < 300; i++) {
      const res = continueMatch(rng, setup(75, 74, i % 2 ? 3 : 5), [], 'A', i % 3 === 0);
      expect(res.winner).not.toBeNull();
      for (const s of res.sets) expect(validSet(s)).toBe(true);
      expect(matchWinner(res.sets, i % 2 ? 3 : 5)).toBe(res.winner);
    }
  });

  it('equal players win about half the time', () => {
    const rng = Rng.fromSeed('equal');
    let wins = 0;
    for (let i = 0; i < 2000; i++) if (quickMatch(rng, setup(75, 75)).winner === 'A') wins++;
    expect(wins / 2000).toBeGreaterThan(0.45);
    expect(wins / 2000).toBeLessThan(0.55);
  });

  it('a 10-point rating gap wins roughly 3 in 4 or more', () => {
    const rng = Rng.fromSeed('gap');
    let wins = 0;
    for (let i = 0; i < 2000; i++) if (quickMatch(rng, setup(85, 75)).winner === 'A') wins++;
    expect(wins / 2000).toBeGreaterThan(0.72);
  });

  it('can pause after a set and resume to a finished match', () => {
    const rng = Rng.fromSeed('pause');
    const first = continueMatch(rng, setup(75, 75), [], 'A', true, 1);
    expect(first.sets).toHaveLength(1);
    expect(first.winner).toBeNull();
    const rest = continueMatch(rng, setup(75, 75), first.sets, first.nextServer, true);
    expect(rest.winner).not.toBeNull();
    expect(rest.sets[0]).toEqual(first.sets[0]);
  });

  it('renders scores from either perspective', () => {
    const score = {
      sets: [
        { a: 6, b: 4, tb: null },
        { a: 6, b: 7, tb: 5 },
        { a: 7, b: 6, tb: 8 },
      ],
      retired: null,
    };
    expect(scoreText(score)).toBe('6-4 6-7(5) 7-6(8)');
    expect(scoreText(score, 'B')).toBe('4-6 7-6(5) 6-7(8)');
  });
});
