import { COACHES, COACH_ORDER, PHYSIO } from './content/coaches';
import { EVENTS_BY_ID } from './content/events';
import { SKILL_IDS } from './model/skills';
import type { Action, CareerState, SkillId } from './model/types';
import { TACTIC_BLOCK_COST, learnableTactics, trainingBlocks } from './sim/tactics';
import { staffCost } from './sim/economy';

/**
 * A reasonable automatic player. Used by tests, the balance report and (optionally) by the
 * UI's "simulate rest of career" debug tool. It never cheats — it only emits actions.
 */
export function botAction(state: CareerState): Action | null {
  const phase = state.phase;
  switch (phase.kind) {
    case 'event': {
      if (phase.event.resolved) return { t: 'continue' };
      const event = EVENTS_BY_ID[phase.event.eventId];
      const options = event?.options ?? [];
      let best = 0;
      let bestScore = -Infinity;
      options.forEach((opt, i) => {
        if (opt.cost !== undefined && state.finance.budget < opt.cost) return;
        const chance = phase.event.chances[i];
        const score = (chance ?? 0.75) + (opt.effects.some((e) => e.kind === 'turn_pro') ? 0.3 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      });
      return { t: 'choose', option: best };
    }
    case 'training': {
      const p = state.player;
      let blocks = trainingBlocks(state);
      const learn = learnableTactics(state)[0] ?? null;
      if (learn) blocks -= TACTIC_BLOCK_COST;
      const rest = p.fatigue > 30 || p.age >= 30 ? 1 : 0;
      blocks -= rest;
      // Spread blocks over the skills with the biggest gap to potential.
      const order = [...SKILL_IDS].sort(
        (a, b) => p.potential[b] - p.skills[b] - (p.potential[a] - p.skills[a]),
      );
      const skills: Partial<Record<SkillId, number>> = {};
      for (let i = 0; i < blocks; i++) {
        const id = order[i % 3] as SkillId;
        skills[id] = (skills[id] ?? 0) + 1;
      }
      return { t: 'train', plan: { skills, rest, learn, preferred: state.tactics.preferred } };
    }
    case 'team': {
      const budget = state.finance.budget;
      let coach = state.team.coach;
      for (const id of COACH_ORDER) {
        const c = COACHES[id];
        if (state.player.reputation >= c.minReputation && c.salary <= Math.max(0, budget) * 0.35)
          coach = id;
      }
      const physio = budget - staffCost(state, coach, false, false) > PHYSIO.salary * 4;
      return { t: 'team', coach, physio, fitnessCoach: false };
    }
    case 'sponsors':
      return { t: 'sponsors', accept: phase.offers.map((o) => o.id) };
    case 'schedule':
      return { t: 'schedule', plan: state.season.plan };
    case 'season':
      return { t: 'play' };
    case 'tactics': {
      let best = 0;
      phase.scout.options.forEach((o, i) => {
        if (o.edge > (phase.scout.options[best]?.edge ?? -1)) best = i;
      });
      return { t: 'choose', option: best };
    }
    case 'season_end': {
      const age = phase.record.age;
      const rank = state.pro.rank ?? 9999;
      if (age >= 34 || (age >= 29 && rank > 250)) return { t: 'retire' };
      return { t: 'continue' };
    }
    case 'retired':
      return null;
  }
}
