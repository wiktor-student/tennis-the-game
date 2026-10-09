import { LEVELS, pointsFor, roundLabel } from '../content/levels';
import { overall } from '../model/skills';
import type { CareerState, TournamentDef } from '../model/types';
import { ratingForRank } from './field';
import { FIELD_BAND, JUNIOR_TIER, projectEntry, type EntryProjection } from './tournament';

/**
 * Pre-tournament outlook: how strong the field of an event is compared with the player.
 * Pure estimate (no RNG) used by the planner, the "next stop" card and autoPlan, so the
 * player can see *before* travelling whether an event is their level.
 */

/** Rating gap → match win chance. Fitted on simulated matches (logistic, scale 6). */
export function winChance(gap: number): number {
  return 1 / (1 + Math.exp(-gap / 6));
}

export type Verdict = 'favourite' | 'even' | 'underdog' | 'longshot' | 'closed';

export interface Outlook {
  entry: EntryProjection;
  /** Player's overall rating. */
  me: number;
  /** Typical first opponent (first qualifying match for qualifiers). */
  opp: number;
  /** Chance to win the first match. */
  first: number;
  /** Most likely exit round label (e.g. 'R32', 'QF', 'Q1'). */
  likely: string;
  /** Expected ranking/standing points. */
  points: number;
  verdict: Verdict;
}

function verdictFor(p: number): Verdict {
  if (p >= 0.65) return 'favourite';
  if (p >= 0.45) return 'even';
  if (p >= 0.25) return 'underdog';
  return 'longshot';
}

/** Typical opponent rating per main-draw round (index 0 = first round). */
function roundOpponents(state: CareerState, def: TournamentDef): number[] {
  const level = LEVELS[def.level];
  const rounds = Math.round(Math.log2(def.level === 'finals' ? 8 : level.drawSize));
  if (!level.pro) {
    // Junior: weighted quantiles of the field slice the event's tier attracts.
    const pool = [...state.field].sort((a, b) => b.rating - a.rating);
    if (pool.length === 0) return Array(rounds).fill(overall(state.player.skills));
    const centre = 1 - (JUNIOR_TIER[def.level] ?? 0.5);
    const w = pool.map((_, i) => {
      const q = i / Math.max(1, pool.length - 1);
      return Math.exp(-((q - centre) ** 2) / (2 * 0.18 ** 2)) + 0.01;
    });
    const total = w.reduce((a, b) => a + b, 0);
    const quantile = (strongShare: number): number => {
      // rating such that `strongShare` of the selected weight is stronger
      let acc = 0;
      for (let i = 0; i < pool.length; i++) {
        acc += w[i] as number;
        if (acc / total >= strongShare) return (pool[i] as { rating: number }).rating;
      }
      return (pool[pool.length - 1] as { rating: number }).rating;
    };
    return Array.from({ length: rounds }, (_, k) => quantile(0.5 ** (k + 1)));
  }
  const band = FIELD_BAND[def.level];
  const firstRank =
    band?.[2] !== undefined
      ? Math.sqrt(band[0] * band[1])
      : Math.max(2, Math.min(level.cutoffMain, 900) * 0.55);
  return Array.from({ length: rounds }, (_, k) =>
    ratingForRank(Math.max(1, firstRank * 0.55 ** k)),
  );
}

export function tournamentOutlook(state: CareerState, def: TournamentDef): Outlook {
  const level = LEVELS[def.level];
  const me = overall(state.player.skills);
  const { status } = projectEntry(state, def);
  const opps = roundOpponents(state, def);
  const rounds = opps.length;

  if (status === 'none') {
    return {
      entry: status,
      me,
      opp: Math.round(opps[0] ?? me),
      first: 0,
      likely: '—',
      points: 0,
      verdict: 'closed',
    };
  }

  // Qualifying: opponents ranked just outside the main-draw cut.
  // `likely` is the median finish: the first round the player gets past less than half the time.
  let likely = '';
  let reach = 1;
  let qualOpp: number | null = null;
  if (status === 'qualifier') {
    const hi = Math.min(level.cutoffQual, level.cutoffMain * 2.2);
    qualOpp = ratingForRank(Math.sqrt(level.cutoffMain * hi));
    for (let r = 0; r < level.qualRounds; r++) {
      reach *= winChance(me - qualOpp);
      if (!likely && reach < 0.5) likely = `Q${r + 1}`;
    }
  }

  let points = 0;
  for (let k = 0; k < rounds; k++) {
    const p = winChance(me - (opps[k] as number));
    points += reach * (1 - p) * pointsFor(level, rounds - k);
    reach *= p;
    if (!likely && reach < 0.5) likely = roundLabel(rounds - k);
  }
  points += reach * pointsFor(level, 0);
  if (!likely) likely = 'W';

  const firstOpp = qualOpp ?? (opps[0] as number);
  const first = winChance(me - firstOpp);
  return {
    entry: status,
    me,
    opp: Math.round(firstOpp),
    first,
    likely,
    points: Math.round(points * 10) / 10,
    verdict: verdictFor(first),
  };
}
