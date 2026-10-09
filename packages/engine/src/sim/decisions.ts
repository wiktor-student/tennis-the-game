import { COACHES } from '../content/coaches';
import { SITUATIONS, SITUATIONS_BY_ID, type Situation } from '../content/situations';
import { MOMENTUM, SUPER_SHARE } from '../model/constants';
import type {
  AIPlayer,
  CareerState,
  DecisionOutcome,
  MatchProgress,
  PendingDecision,
  StageId,
  Surface,
} from '../model/types';
import type { Rng } from '../rng';
import { applyEffects } from './effects';
import { setsWon } from './match';

const STAGE_ORDER: StageId[] = ['mini', 'national', 'europe', 'itf_junior', 'pro'];

export interface DecisionContext {
  moment: 'first' | 'deciding';
  surface: Surface;
  leading: boolean;
  trailing: boolean;
  afterTiebreak: boolean;
  nemesis: boolean;
}

export function pickSituation(state: CareerState, rng: Rng, ctx: DecisionContext): Situation {
  if (ctx.nemesis && rng.chance(0.6)) return SITUATIONS_BY_ID.nemesis as Situation;
  const stageIdx = STAGE_ORDER.indexOf(state.season.stage);
  const candidates = SITUATIONS.filter((s) => {
    const w = s.when;
    if (s.weight <= 0) return false;
    if (w.moment !== 'any' && w.moment !== ctx.moment) return false;
    if (w.leading && !ctx.leading) return false;
    if (w.trailing && !ctx.trailing) return false;
    if (w.afterTiebreak && !ctx.afterTiebreak) return false;
    if (w.surfaces && !w.surfaces.includes(ctx.surface)) return false;
    if (w.minStage && stageIdx < STAGE_ORDER.indexOf(w.minStage)) return false;
    if (w.maxStage && stageIdx > STAGE_ORDER.indexOf(w.maxStage)) return false;
    return true;
  });
  return rng.weighted(candidates, (s) => s.weight);
}

export function situationChances(
  state: CareerState,
  situation: Situation,
  opp: AIPlayer,
): PendingDecision['options'] {
  const skills = state.player.skills;
  const coach = COACHES[state.team.coach];
  return situation.options.map((opt) => {
    let weighted = 0;
    let total = 0;
    for (const [id, w] of Object.entries(opt.skills)) {
      weighted += (w as number) * skills[id as keyof typeof skills];
      total += w as number;
    }
    weighted /= total || 1;
    const raw =
      opt.base +
      (1.1 * (weighted - opp.rating)) / 100 +
      coach.decisionBonus +
      (state.player.morale - 50) * 0.0008;
    const chance = Math.max(0.05, Math.min(0.95, raw));
    const superChance = chance * (opt.risky ? SUPER_SHARE.risky : SUPER_SHARE.safe);
    return {
      chance: Math.round(chance * 1000) / 1000,
      superChance: Math.round(superChance * 1000) / 1000,
      risky: opt.risky,
    };
  });
}

export function buildDecision(
  state: CareerState,
  rng: Rng,
  match: MatchProgress,
  opp: AIPlayer,
  surface: Surface,
  scoreText: string,
): PendingDecision {
  const won = setsWon(match.sets);
  const ctx: DecisionContext = {
    moment: match.sets.length === 1 ? 'first' : 'deciding',
    surface,
    leading: won.a > won.b,
    trailing: won.b > won.a,
    afterTiebreak: match.sets[match.sets.length - 1]?.tb != null,
    nemesis: !!opp.nemesis,
  };
  const situation = pickSituation(state, rng, ctx);
  return {
    situationId: situation.id,
    options: situationChances(state, situation, opp),
    scoreText,
    oppName: `${opp.first} ${opp.last}`,
    round: match.round,
    resolved: null,
  };
}

/** Roll the chosen option. The UI's roulette animates towards `roll`. */
export function resolveDecision(
  state: CareerState,
  rng: Rng,
  decision: PendingDecision,
  option: number,
): {
  outcome: DecisionOutcome;
  momentum: number;
} {
  const view = decision.options[option];
  const situation = SITUATIONS_BY_ID[decision.situationId];
  const opt = situation?.options[option];
  if (!view || !opt) throw new Error('Invalid decision option');
  const roll = rng.float();
  const outcome: DecisionOutcome =
    roll < view.superChance ? 'super' : roll < view.chance ? 'success' : 'fail';
  const table = view.risky ? MOMENTUM.risky : MOMENTUM.safe;
  const momentum = table[outcome];
  const side = opt.side?.[outcome];
  if (side) applyEffects(state, side);
  if (outcome === 'super') state.stats.decisionsSuper += 1;
  decision.resolved = { option, outcome, momentum, roll: Math.round(roll * 1000) / 1000 };
  return { outcome, momentum };
}
