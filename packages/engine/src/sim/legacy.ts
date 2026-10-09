import { evaluateAchievements } from '../content/achievements';
import { BACKGROUNDS, DIFFICULTIES } from '../content/backgrounds';
import { LEVELS } from '../content/levels';
import { verdictFor } from '../content/verdicts';
import type { CareerSummary } from '../model/summary';
import type { CareerState, LevelId, RetireReason, SurfaceGroup } from '../model/types';
import { surfaceGroup } from '../model/skills';
import { ENGINE_VERSION } from '../version';

const TITLE_VALUE: Partial<Record<LevelId, number>> = {
  gs: 600,
  finals: 350,
  m1000: 180,
  t500: 90,
  t250: 50,
  ch175: 12,
  ch125: 12,
  ch75: 12,
  itf25: 3,
  itf15: 3,
  j_slam: 40,
  j_mini_pl: 5,
  j_nat_pl: 5,
};

function peakValue(rank: number | null): number {
  if (rank === null) return 0;
  if (rank === 1) return 300;
  if (rank <= 5) return 200;
  if (rank <= 10) return 150;
  if (rank <= 20) return 100;
  if (rank <= 50) return 60;
  if (rank <= 100) return 35;
  if (rank <= 200) return 15;
  if (rank <= 500) return 5;
  return 0;
}

/** Raw LEGACY — see the table in docs/GAME_DESIGN.md §13. */
export function legacyRaw(state: CareerState): number {
  const s = state.stats;
  let total = 0;
  for (const t of s.titles) total += TITLE_VALUE[t.level] ?? (LEVELS[t.level].pro ? 0 : 2);
  const slamTitles = Object.values(s.slamTitles).reduce((a, b) => a + b, 0);
  total += Math.max(0, s.slamFinals - slamTitles) * 200;
  total += Math.max(0, s.slamSemis - s.slamFinals) * 80;
  total += Math.max(0, s.slamQuarters - s.slamSemis) * 30;
  total += s.olympic.gold * 400 + s.olympic.silver * 220 + s.olympic.bronze * 150;
  total += s.weeksAtNo1 * 8 + s.yearEndNo1 * 250;
  total += peakValue(s.peakRank);
  total += s.juniorYearEndNo1 ? 30 : 0;
  total += s.proMatchesWon * 0.5;
  total += (s.prizeMoney / 1_000_000) * 10;
  total += s.davisCup * 50;
  return Math.round(total);
}

export function legacyMultiplier(state: CareerState): number | null {
  const bg = BACKGROUNDS[state.config.background].multiplier;
  if (bg === null) return null;
  return bg * DIFFICULTIES[state.config.difficulty].multiplier;
}

export function computeLegacy(state: CareerState): number {
  const raw = legacyRaw(state);
  const mult = legacyMultiplier(state);
  return Math.round(raw * (mult ?? 1));
}

export function buildSummary(state: CareerState, reason: RetireReason = 'choice'): CareerSummary {
  const s = state.stats;
  const surfaceTitles: Record<SurfaceGroup, number> = { clay: 0, grass: 0, hard: 0 };
  let proTitles = 0;
  for (const t of s.titles) {
    if (!LEVELS[t.level].pro) continue;
    proTitles += 1;
    surfaceTitles[surfaceGroup(t.surface)] += 1;
  }
  const slamTitles = Object.values(s.slamTitles).reduce((a, b) => a + b, 0);
  const summary: CareerSummary = {
    engineVersion: ENGINE_VERSION,
    name: `${state.player.first} ${state.player.last}`,
    gender: state.config.gender,
    background: state.config.background,
    difficulty: state.config.difficulty,
    mode: state.config.mode,
    seasons: state.history.length,
    finalAge: state.player.age,
    retireReason: reason,
    legacy: computeLegacy(state),
    legacyRaw: legacyRaw(state),
    rankable: legacyMultiplier(state) !== null,
    verdict: '',
    peakRank: s.peakRank,
    peakRankYear: s.peakRankYear,
    weeksAtNo1: s.weeksAtNo1,
    yearEndNo1: s.yearEndNo1,
    titles: s.titles.length,
    proTitles,
    slamTitles,
    slams: { ...s.slamTitles },
    slamFinals: s.slamFinals,
    finalsTitles: s.proTitlesByLevel.finals ?? 0,
    m1000Titles: s.proTitlesByLevel.m1000 ?? 0,
    surfaceTitles,
    olympic: { ...s.olympic },
    davisCup: s.davisCup,
    juniorSlamTitles: s.juniorSlamTitles,
    juniorYearEndNo1: s.juniorYearEndNo1,
    polishChampionships: s.polishChampionships,
    prizeMoney: s.prizeMoney,
    proWins: s.proMatchesWon,
    proLosses: s.proMatchesLost,
    seriousInjuries: s.seriousInjuries,
    decisionsSuper: s.decisionsSuper,
    nemesisWon: s.nemesisWon,
    nemesisLost: s.nemesisLost,
    maxDebt: s.maxDebt,
    fiveSetWins: s.fiveSetWins,
    doubleBagels: s.doubleBagels,
    bigUpsets: s.bigUpsets,
    qualifierTitles: s.qualifierTitles,
    wildcardTitles: s.wildcardTitles,
    turnedProAge: state.pro.turnedProAge,
    petitsAs: s.titles.some((t) => t.tournamentId === 'te-tarbes'),
    orangeBowl: s.titles.some((t) => t.tournamentId === 'j-orange'),
    topRanksByYear: state.history.filter((h) => h.stage === 'pro').map((h) => h.rankEnd),
    flags: [...state.flags],
  };
  summary.verdict = verdictFor(summary).id;
  return summary;
}

export function achievementsFor(state: CareerState, reason: RetireReason = 'choice'): string[] {
  return evaluateAchievements(buildSummary(state, reason));
}
