import { COACHES, FITNESS_COACH } from '../content/coaches';
import { BASE_GROWTH, ageDecline, ageGrowthFactor } from '../model/constants';
import { SKILL_IDS, clampSkill } from '../model/skills';
import type { CareerState, SkillId, Skills, SurfaceGroup } from '../model/types';
import type { Rng } from '../rng';

/** Expected skill gain for the chosen winter training focus. */
export function trainingGain(state: CareerState): number {
  const coach = COACHES[state.team.coach];
  const factor = Math.max(0.45, ageGrowthFactor(state.player.age));
  return Math.round(coach.trainingBonus * factor * 10) / 10;
}

export function applyTraining(state: CareerState, skill: SkillId): number {
  // Diminishing returns once a skill approaches its potential.
  const headroom = (state.player.potential[skill] + 2 - state.player.skills[skill]) / 8;
  const gain = Math.round(trainingGain(state) * Math.max(0.15, Math.min(1, headroom)) * 10) / 10;
  state.player.skills[skill] = clampSkill(state.player.skills[skill] + gain);
  return gain;
}

/**
 * End-of-season development: growth towards potential (coach multiplier, chemistry,
 * randomness) and age-related decline. Returns per-skill deltas for the season report.
 */
export function developPlayer(state: CareerState, rng: Rng): Partial<Skills> {
  const p = state.player;
  const coach = COACHES[state.team.coach];
  const chemistry = 1 + Math.min(0.08, state.team.coachSeasons * 0.02);
  const growth = ageGrowthFactor(p.age);
  const decline = ageDecline(p.age);
  const deltas: Partial<Skills> = {};

  for (const id of SKILL_IDS) {
    const before = p.skills[id];
    let value = before;
    if (growth > 0) {
      const gap = Math.max(0, p.potential[id] - value);
      let mult = coach.growth * chemistry;
      if (id === 'fitness' && state.team.fitnessCoach) mult *= FITNESS_COACH.fitnessGrowth;
      value += gap * BASE_GROWTH * growth * mult * rng.range(0.8, 1.2);
    }
    if (decline.skills > 0) {
      let loss =
        id === 'fitness'
          ? decline.fitness
          : id === 'mental'
            ? decline.skills * 0.3
            : decline.skills;
      if (id === 'fitness' && state.team.fitnessCoach) loss *= FITNESS_COACH.declineReduction;
      value -= loss * rng.range(0.7, 1.3);
    }
    p.skills[id] = clampSkill(value);
    const delta = Math.round((p.skills[id] - before) * 10) / 10;
    if (delta !== 0) deltas[id] = delta;
  }
  return deltas;
}

/** Surface proficiency grows with matches played on that surface. */
export function surfaceExperience(state: CareerState, group: SurfaceGroup, matches: number): void {
  const current = state.player.surfaces[group];
  let value = current;
  for (let i = 0; i < matches; i++) value += (88 - value) * 0.012;
  state.player.surfaces[group] = Math.round(value * 10) / 10;
}
