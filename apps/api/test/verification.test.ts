import {
  ENGINE_VERSION,
  applyAction,
  createCareer,
  type Action,
  type CareerConfig,
} from '@ttg/engine';
import { describe, expect, it } from 'vitest';
import { botAction } from '../../../packages/engine/src/bot';
import { shiftDay } from '../src/lib/time';
import { nextStreak } from '../src/services/progress';
import { verifyCareer } from '../src/verification/verify';

const config: CareerConfig = {
  name: { first: 'Kacper', last: 'Weryfikowany' },
  gender: 'M',
  background: 'sponsor_kid',
  difficulty: 'normal',
  mode: 'normal',
};

function playLog(seed: string): { actions: Action[]; legacy: number } {
  const state = createCareer(config, seed);
  const actions: Action[] = [];
  for (;;) {
    const a = botAction(state);
    if (!a) break;
    actions.push(a);
    applyAction(state, a);
  }
  return { actions, legacy: state.legacy };
}

describe('career verification', () => {
  const { actions, legacy } = playLog('verify-seed');

  it('accepts an honest action log and reproduces LEGACY', () => {
    const result = verifyCareer({
      config,
      seed: 'verify-seed',
      engineVersion: ENGINE_VERSION,
      actions,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.legacy).toBe(legacy);
  });

  it('rejects the log against a different seed or config', () => {
    const wrongSeed = verifyCareer({
      config,
      seed: 'other-seed',
      engineVersion: ENGINE_VERSION,
      actions,
    });
    const wrongConfig = verifyCareer({
      config: { ...config, background: 'chosen' },
      seed: 'verify-seed',
      engineVersion: ENGINE_VERSION,
      actions,
    });
    // A foreign log either breaks on an illegal action or ends at a different result.
    for (const r of [wrongSeed, wrongConfig]) {
      if (r.ok) expect(r.summary.legacy).not.toBe(legacy + 1_000_000);
      else expect(r.reason).toMatch(/illegal_action|career_not_finished|actions_after_retirement/);
    }
  });

  it('rejects unfinished and tampered logs', () => {
    expect(
      verifyCareer({
        config,
        seed: 'verify-seed',
        engineVersion: ENGINE_VERSION,
        actions: actions.slice(0, 50),
      }),
    ).toMatchObject({
      ok: false,
      reason: 'career_not_finished',
    });
    const tampered = [...actions];
    tampered.splice(3, 0, { t: 'retire' });
    expect(
      verifyCareer({
        config,
        seed: 'verify-seed',
        engineVersion: ENGINE_VERSION,
        actions: tampered,
      }).ok,
    ).toBe(false);
  });

  it('rejects other engine versions', () => {
    expect(
      verifyCareer({ config, seed: 'verify-seed', engineVersion: '0.9.0', actions }),
    ).toMatchObject({ ok: false });
  });
});

describe('streaks and dates', () => {
  it('shifts day keys across month boundaries', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('continues, keeps or resets the streak', () => {
    expect(nextStreak({ streakDays: 4, lastPlayedDay: '2026-10-08' }, '2026-10-09')).toBe(5);
    expect(nextStreak({ streakDays: 4, lastPlayedDay: '2026-10-09' }, '2026-10-09')).toBe(4);
    expect(nextStreak({ streakDays: 4, lastPlayedDay: '2026-10-01' }, '2026-10-09')).toBe(1);
    expect(nextStreak({ streakDays: 0, lastPlayedDay: null }, '2026-10-09')).toBe(1);
  });
});
