import { l } from '../i18n';
import { clampSkill, SKILL_IDS } from '../model/skills';
import type { CareerState, EffectTarget } from '../model/types';
import { addLedger } from './economy';

const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

/** Apply story/decision effects. Structural effects (turn_pro, promote) only set flags. */
export function applyEffects(state: CareerState, effects: EffectTarget[]): void {
  const p = state.player;
  for (const e of effects) {
    switch (e.kind) {
      case 'skill':
        p.skills[e.skill] = clampSkill(p.skills[e.skill] + e.delta);
        break;
      case 'potential': {
        const ids = e.skill === 'all' ? SKILL_IDS : [e.skill];
        for (const id of ids) p.potential[id] = Math.min(99, p.potential[id] + e.delta);
        break;
      }
      case 'budget':
        addLedger(state, 'event', l('Wydarzenie', 'Event'), e.delta);
        break;
      case 'media':
        p.media = clamp100(p.media + e.delta);
        break;
      case 'reputation':
        p.reputation = clamp100(p.reputation + e.delta);
        break;
      case 'morale':
        p.morale = clamp100(p.morale + e.delta);
        break;
      case 'fatigue':
        p.fatigue = clamp100(p.fatigue + e.delta);
        break;
      case 'surface':
        p.surfaces[e.surface] = clamp100(p.surfaces[e.surface] + e.delta);
        break;
      case 'injury':
        if (!p.injury || p.injury.weeks < e.weeks) {
          p.injury = { weeks: e.weeks, kind: e.injury, serious: !!e.serious };
        }
        if (e.serious) {
          state.stats.seriousInjuries += 1;
          p.skills.fitness = clampSkill(p.skills.fitness - 1.5);
        }
        break;
      case 'coach':
        if (state.team.coach !== e.coach) {
          state.team.coach = e.coach;
          state.team.coachSeasons = 0;
        }
        break;
      case 'flag':
        if (!state.flags.includes(e.flag)) state.flags.push(e.flag);
        break;
      case 'davis_cup':
        state.stats.davisCup += 1;
        break;
      case 'promote':
        if (!state.flags.includes('promote')) state.flags.push('promote');
        break;
      case 'turn_pro':
        if (!state.flags.includes('turn_pro_now')) state.flags.push('turn_pro_now');
        break;
      case 'exempt':
        state.pro.exemptions += e.count;
        break;
      case 'reveal_height':
        p.heightRevealed = true;
        break;
      case 'tactic':
        if (!state.tactics.owned.includes(e.tactic)) state.tactics.owned.push(e.tactic);
        break;
      case 'retire_forced':
        if (!state.flags.includes('retire_forced')) state.flags.push('retire_forced');
        break;
    }
  }
}
