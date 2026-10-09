import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from '../src/rng';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = Rng.fromSeed('wimbledon');
    const b = Rng.fromSeed('wimbledon');
    for (let i = 0; i < 1000; i++) expect(a.nextU32()).toBe(b.nextU32());
  });

  it('differs between seeds', () => {
    expect(hashSeed('a')).not.toEqual(hashSeed('b'));
  });

  it('can be resumed from a serialized state', () => {
    const a = Rng.fromSeed('resume');
    for (let i = 0; i < 50; i++) a.float();
    const b = new Rng(a.state);
    for (let i = 0; i < 100; i++) expect(b.float()).toBe(a.float());
  });

  it('produces floats in [0, 1) with a sane mean', () => {
    const rng = Rng.fromSeed('mean');
    let sum = 0;
    for (let i = 0; i < 20_000; i++) {
      const x = rng.float();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
    }
    expect(sum / 20_000).toBeCloseTo(0.5, 1);
  });

  it('int() stays within inclusive bounds', () => {
    const rng = Rng.fromSeed('ints');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(rng.int(1, 6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('weighted() never picks zero-weight items', () => {
    const rng = Rng.fromSeed('weights');
    for (let i = 0; i < 500; i++) expect(rng.weighted(['a', 'b', 'c'], (x) => (x === 'b' ? 0 : 1))).not.toBe('b');
  });
});
