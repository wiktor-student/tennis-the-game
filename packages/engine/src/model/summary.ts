import type {
  BackgroundId,
  CareerMode,
  DifficultyId,
  Gender,
  RetireReason,
  SlamId,
  SurfaceGroup,
} from './types';

/**
 * Compact, serializable result of a finished career. This is what leaderboards, the
 * museum, achievements and goals work with — and what the API stores after verification.
 */
export interface CareerSummary {
  engineVersion: string;
  name: string;
  gender: Gender;
  background: BackgroundId;
  difficulty: DifficultyId;
  mode: CareerMode;
  seasons: number;
  finalAge: number;
  retireReason: RetireReason;
  legacy: number;
  /** Legacy before the background/difficulty multiplier. */
  legacyRaw: number;
  rankable: boolean;
  verdict: string;
  peakRank: number | null;
  peakRankYear: number | null;
  weeksAtNo1: number;
  yearEndNo1: number;
  titles: number;
  proTitles: number;
  slamTitles: number;
  slams: Record<SlamId, number>;
  slamFinals: number;
  finalsTitles: number;
  m1000Titles: number;
  surfaceTitles: Record<SurfaceGroup, number>;
  olympic: { gold: number; silver: number; bronze: number };
  davisCup: number;
  juniorSlamTitles: number;
  juniorYearEndNo1: boolean;
  polishChampionships: number;
  prizeMoney: number;
  proWins: number;
  proLosses: number;
  seriousInjuries: number;
  decisionsSuper: number;
  nemesisWon: number;
  nemesisLost: number;
  maxDebt: number;
  fiveSetWins: number;
  doubleBagels: number;
  bigUpsets: number;
  qualifierTitles: number;
  wildcardTitles: number;
  turnedProAge: number | null;
  petitsAs: boolean;
  orangeBowl: boolean;
  topRanksByYear: (number | null)[];
  flags: string[];
}
