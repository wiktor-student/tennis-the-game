import { COACH_ORDER, COACHES } from '../content/coaches';
import { MASTERY_WINS, TACTICS, TACTICS_BY_ID } from '../content/tactics';
import { ageGrowthFactor } from '../model/constants';
import { SKILL_IDS, clampSkill, overall } from '../model/skills';
import type {
  AIPlayer,
  CareerState,
  SkillId,
  Surface,
  TacticOptionView,
  TrainingPlan,
} from '../model/types';

/** Blocks needed to learn a new tactic card in the offseason. */
export const TACTIC_BLOCK_COST = 2;

/** Hard cap of a card's edge, in percentage points. */
const EDGE_CAP = 4;

/** Content values are written on a readable scale; this maps them to point probability. */
const MATCHUP_SCALE = 0.35;

/** In ordinary matches the preferred card is played on autopilot — half the effect. */
export const AUTOPILOT_FACTOR = 0.5;

export function masteryLevel(state: CareerState, tacticId: string): number {
  const won = state.tactics.record[tacticId]?.won ?? 0;
  return MASTERY_WINS.filter((w) => won >= w).length;
}

/**
 * Expected edge of a card against an opponent on a surface, in serve-point probability.
 * Matchup (style, surface) + fit with the player's own strengths + mastery.
 */
export function tacticEdge(
  state: CareerState,
  tacticId: string,
  opp: Pick<AIPlayer, 'style'>,
  surface: Surface,
): TacticOptionView {
  const t = TACTICS_BY_ID[tacticId];
  if (!t) throw new Error(`Unknown tactic ${tacticId}`);
  const skills = state.player.skills;
  const ovr = overall(skills);
  let weighted = 0;
  let total = 0;
  for (const [id, w] of Object.entries(t.skills)) {
    weighted += (w as number) * skills[id as SkillId];
    total += w as number;
  }
  const fit = (weighted / (total || 1) - ovr) * 0.05;
  const mastery = masteryLevel(state, tacticId);
  const pp =
    (t.vsStyle[opp.style] + (t.surface[surface] ?? 0)) * MATCHUP_SCALE + fit + mastery * 0.15;
  const capped = Math.max(-EDGE_CAP, Math.min(EDGE_CAP, pp));
  return {
    tacticId,
    edge: Math.round(capped * 10) / 1000,
    spread: Math.round(t.risk * 1.5 * 10) / 1000,
    mastery,
  };
}

export function deckOptions(
  state: CareerState,
  opp: Pick<AIPlayer, 'style'>,
  surface: Surface,
): TacticOptionView[] {
  return state.tactics.owned.map((id) => tacticEdge(state, id, opp, surface));
}

export function recordTacticUse(state: CareerState, tacticId: string | null, won: boolean): void {
  if (!tacticId) return;
  const rec = (state.tactics.record[tacticId] ??= { played: 0, won: 0 });
  rec.played += 1;
  if (won) rec.won += 1;
}

/** Cards the current coach can teach this offseason. */
export function learnableTactics(state: CareerState): string[] {
  const coachTier = COACH_ORDER.indexOf(state.team.coach);
  return TACTICS.filter(
    (t) =>
      t.teacher !== null &&
      !state.tactics.owned.includes(t.id) &&
      COACH_ORDER.indexOf(t.teacher) <= coachTier &&
      state.player.age >= t.minAge,
  ).map((t) => t.id);
}

// ─── Block training ──────────────────────────────────────────────────────────

export function trainingBlocks(state: CareerState): number {
  const coachTier = COACH_ORDER.indexOf(state.team.coach);
  return (
    5 + (coachTier >= COACH_ORDER.indexOf('academy') ? 1 : 0) + (state.team.fitnessCoach ? 1 : 0)
  );
}

/** Gain of the first block on a skill (later blocks on the same skill give less). */
export function blockGain(state: CareerState, skill: SkillId): number {
  const coach = COACHES[state.team.coach];
  const p = state.player;
  const headroom = Math.max(0.15, Math.min(1, (p.potential[skill] + 2 - p.skills[skill]) / 8));
  return coach.trainingBonus * Math.max(0.45, ageGrowthFactor(p.age)) * 0.3 * headroom;
}

/** Diminishing returns: 1, 0.75, 0.56, 0.42, ... of the first block's gain. */
export function blocksGain(state: CareerState, skill: SkillId, blocks: number): number {
  const g = blockGain(state, skill);
  let sum = 0;
  for (let k = 0; k < blocks; k++) sum += g * 0.75 ** k;
  return Math.round(sum * 10) / 10;
}

export function validateTraining(state: CareerState, plan: TrainingPlan): string | null {
  const blocks = trainingBlocks(state);
  let used = plan.rest;
  for (const id of SKILL_IDS) used += plan.skills[id] ?? 0;
  if (plan.learn) {
    if (!learnableTactics(state).includes(plan.learn)) return 'Tactic cannot be learned now';
    used += TACTIC_BLOCK_COST;
  }
  if (plan.rest < 0 || Object.values(plan.skills).some((n) => (n ?? 0) < 0))
    return 'Negative blocks';
  if (used !== blocks) return `Training must use exactly ${blocks} blocks`;
  const preferredOk = state.tactics.owned.includes(plan.preferred) || plan.preferred === plan.learn;
  if (!preferredOk) return 'Preferred tactic not owned';
  return null;
}

export function applyTrainingPlan(state: CareerState, plan: TrainingPlan): void {
  const p = state.player;
  for (const id of SKILL_IDS) {
    const n = plan.skills[id] ?? 0;
    if (n > 0) p.skills[id] = clampSkill(p.skills[id] + blocksGain(state, id, n));
  }
  if (plan.rest > 0) {
    p.fatigue = Math.max(0, p.fatigue - plan.rest * 6);
    p.morale = Math.min(100, p.morale + plan.rest * 3);
  }
  state.season.restBlocks = plan.rest;
  if (plan.learn && !state.tactics.owned.includes(plan.learn)) state.tactics.owned.push(plan.learn);
  state.tactics.preferred = plan.preferred;
}
