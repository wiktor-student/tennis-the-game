import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rng';
import { buildDraw, seedOrder } from '../src/sim/tournament';
import { pointsForRank, rankFromPoints, ratingForRank, sumBest } from '../src/sim/field';

describe('draws', () => {
  it('seed order pairs 1 with the last position', () => {
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('places the top two seeds in opposite halves', () => {
    const rng = Rng.fromSeed('draw');
    const entrants = Array.from({ length: 32 }, (_, i) => `p${i + 1}`);
    for (let i = 0; i < 50; i++) {
      const { draw, seeds } = buildDraw(rng, entrants, 32);
      expect(draw.indexOf('p1')).toBeLessThan(16);
      expect(draw.indexOf('p2')).toBeGreaterThanOrEqual(16);
      expect(Object.keys(seeds)).toHaveLength(8);
      expect(new Set(draw).size).toBe(32);
    }
  });

  it('gives byes to the top seeds in a short field', () => {
    const rng = Rng.fromSeed('byes');
    const entrants = Array.from({ length: 28 }, (_, i) => `p${i + 1}`);
    const { draw } = buildDraw(rng, entrants, 32);
    const p1 = draw.indexOf('p1');
    expect(draw[p1 % 2 === 0 ? p1 + 1 : p1 - 1]).toBeNull();
    expect(draw.filter((x) => x === null)).toHaveLength(4);
  });
});

describe('ranking', () => {
  it('counts only the best 19 results inside 52 weeks', () => {
    const results: [number, number][] = Array.from({ length: 25 }, (_, i) => [100 + i, 10]);
    results.push([40, 1000]); // too old
    expect(sumBest(results, 124)).toBe(190);
  });

  it('rating and points curves are monotonic and invertible', () => {
    expect(ratingForRank(1)).toBeGreaterThan(ratingForRank(10));
    expect(ratingForRank(10)).toBeGreaterThan(ratingForRank(100));
    for (const rank of [300, 600, 1200]) {
      expect(Math.abs(rankFromPoints(pointsForRank(rank)) - rank) / rank).toBeLessThan(0.02);
    }
  });
});
