import type { L } from '../i18n';
import type { RngState } from '../rng';

// ─── Enumerations ────────────────────────────────────────────────────────────

export type Gender = 'M' | 'F';
export type SkillId = 'serve' | 'return' | 'forehand' | 'backhand' | 'net' | 'fitness' | 'mental';
export type Skills = Record<SkillId, number>;
export type Surface = 'clay' | 'grass' | 'hard' | 'indoor';
/** Proficiency groups — indoor courts count as hard courts. */
export type SurfaceGroup = 'clay' | 'grass' | 'hard';
export type BackgroundId = 'wall' | 'sponsor_kid' | 'academy' | 'chosen';
export type DifficultyId = 'normal' | 'hard';
export type CareerMode = 'normal' | 'daily';
export type StageId = 'mini' | 'national' | 'europe' | 'itf_junior' | 'pro';
export type FormId = 'crisis' | 'weak' | 'normal' | 'good' | 'great' | 'life';
export type CoachId = 'dad' | 'club' | 'licensed' | 'academy' | 'tour' | 'super';
export type SlamId = 'ao' | 'rg' | 'wim' | 'uso';
export type Region = 'pl' | 'eu' | 'am' | 'as' | 'oc';
export type PlayStyle = 'server' | 'grinder' | 'allround' | 'netrusher';
export type Hand = 'R' | 'L';

export type ProLevelId =
  | 'gs'
  | 'm1000'
  | 't500'
  | 't250'
  | 'ch175'
  | 'ch125'
  | 'ch75'
  | 'itf25'
  | 'itf15'
  | 'finals'
  | 'olympics';

export type JuniorLevelId =
  | 'j_mini'
  | 'j_mini_pl'
  | 'j_nat_b'
  | 'j_nat_a'
  | 'j_nat_pl'
  | 'te3'
  | 'te2'
  | 'te1'
  | 'te_super'
  | 'te_euro'
  | 'j60'
  | 'j100'
  | 'j200'
  | 'j300'
  | 'j500'
  | 'j_slam'
  | 'j_ob';

export type LevelId = ProLevelId | JuniorLevelId;

/** Round reached, counted from the final: 0 = champion, 1 = final, 2 = SF, 3 = QF, ... */
export type RoundFromEnd = number;

// ─── Content definitions ─────────────────────────────────────────────────────

export interface TournamentDef {
  id: string;
  name: L;
  city: L;
  country: string; // ISO-3166 alpha-2
  region: Region;
  level: LevelId;
  surface: Surface;
  /** Week of the year the tournament starts in. */
  week: number;
  /** Number of calendar weeks the event occupies. */
  span: number;
  stage: StageId;
  slam?: SlamId;
  genders: Gender[];
  /** Only held in these years (e.g. Olympics). */
  years?: number[];
}

// ─── Actors ──────────────────────────────────────────────────────────────────

/** A computer-controlled player (junior rival or professional). */
export interface AIPlayer {
  id: string;
  first: string;
  last: string;
  nat: string;
  birthYear: number;
  rating: number;
  potential: number;
  style: PlayStyle;
  surfacePref: SurfaceGroup | null;
  hand: Hand;
  /** Pressure-handling, roughly rating ± noise. */
  mental: number;
  /** Rolling ranking results: [globalWeek, points]. Pro only. */
  results: [number, number][];
  points: number;
  rank: number | null;
  /** Former junior rival who followed the player into the pro tour. */
  rival?: boolean;
  nemesis?: boolean;
}

export interface InjuryState {
  weeks: number;
  kind: InjuryKind;
  serious: boolean;
}

export type InjuryKind = 'wrist' | 'ankle' | 'back' | 'shoulder' | 'abdominal' | 'knee' | 'elbow';

export interface PlayerState {
  first: string;
  last: string;
  gender: Gender;
  nat: 'PL';
  birthYear: number;
  age: number;
  hand: Hand;
  heightCm: number;
  heightRevealed: boolean;
  skills: Skills;
  potential: Skills;
  surfaces: Record<SurfaceGroup, number>;
  morale: number;
  media: number;
  reputation: number;
  fatigue: number;
  injury: InjuryState | null;
  /** Consecutive weeks played without a rest week. */
  streakWeeks: number;
}

export interface TeamState {
  coach: CoachId;
  physio: boolean;
  fitnessCoach: boolean;
  /** Seasons with the current coach — chemistry grows over time. */
  coachSeasons: number;
}

export type SponsorCategory = 'apparel' | 'racket' | 'main' | 'lifestyle';

export interface SponsorCondition {
  kind: 'rank_top' | 'titles' | 'media';
  value: number;
}

export interface SponsorOffer {
  id: string;
  templateId: string;
  name: string;
  category: SponsorCategory;
  /** PLN per season. */
  amount: number;
  seasons: number;
  perk: L;
  condition: SponsorCondition | null;
}

export interface ActiveSponsor extends SponsorOffer {
  seasonsLeft: number;
}

export interface LedgerEntry {
  kind:
    | 'family'
    | 'sponsor'
    | 'staff'
    | 'equipment'
    | 'travel'
    | 'prize'
    | 'event'
    | 'bonus'
    | 'penalty';
  label: L;
  amount: number;
}

export interface FinanceState {
  budget: number;
  familyTier: 0 | 1 | 2;
  familySupport: number;
  familyRevealed: boolean;
  /** Ledger of the season in progress. */
  ledger: LedgerEntry[];
}

// ─── Matches & tournaments ───────────────────────────────────────────────────

export interface SetScore {
  a: number;
  b: number;
  /** Tie-break points of the set loser, when the set went to a tie-break. */
  tb: number | null;
}

export interface MatchScore {
  sets: SetScore[];
  retired: 'A' | 'B' | null;
  walkover?: boolean;
}

export interface PlayedMatch {
  round: string; // e.g. 'R32', 'QF', 'Q1', 'RR1', 'BRONZE'
  oppId: string;
  oppName: string;
  oppNat: string;
  oppRank: number | null;
  oppSeed: number | null;
  won: boolean;
  score: MatchScore;
  /** Score rendered from the player's perspective, e.g. "6-4 3-6 7-6(5)". */
  scoreText: string;
  /** Tactic card played (key matches: chosen by the player; others: preferred card). */
  tactic: string | null;
  /** Planned edge of the tactic, in serve-point probability. */
  edge: number;
  keyMatch: boolean;
  nemesis: boolean;
  /** Ratings at the time of the match (overall), to explain results. */
  oppOvr: number;
  meOvr: number;
}

/** A match about to start (or in progress), possibly waiting for the player's tactic. */
export interface MatchProgress {
  oppId: string;
  round: string;
  bestOf: 3 | 5;
  sets: SetScore[];
  /** 'A' = player serves first in the next set. */
  nextServer: 'A' | 'B';
  key: boolean;
  tactic: string | null;
  edge: number;
  spread: number;
  /** Day-form noise rolled once per match (player, opponent). */
  dayA: number;
  dayB: number;
}

export type EntryType = 'direct' | 'qualifier' | 'wildcard' | 'exempt' | 'invited' | 'none';

export interface TournamentRun {
  tournamentId: string;
  slot: number;
  entry: EntryType;
  /** Qualifying rounds still to play before the main draw. */
  qualifying: { opponents: string[]; index: number } | null;
  /** Current round participants in bracket order ('P' = player, null = bye). */
  draw: (string | null)[];
  /** Seeds by participant id. */
  seeds: Record<string, number>;
  roundIndex: number;
  /** Round-robin state for the season finals. */
  groups: { a: string[]; b: string[]; wins: Record<string, number> } | null;
  matches: PlayedMatch[];
  pending: MatchProgress | null;
  /** Bronze medal match flag for the Olympics. */
  bronze: boolean;
  /** Losing semi-finalists (Olympic bronze match). */
  sfLosers: string[];
  /** Round-robin wins (season finals). */
  rrWins: number;
  done: boolean;
  /** Final round reached counted from the end (0 = won the tournament). */
  reached: RoundFromEnd | null;
  /** Bracket outcome for every AI participant: id -> roundFromEnd reached. */
  aiReached: Record<string, RoundFromEnd>;
  qualPoints: number;
}

export interface TournamentResult {
  tournamentId: string;
  year: number;
  level: LevelId;
  surface: Surface;
  slam: SlamId | null;
  entry: EntryType;
  /** null = lost in qualifying, otherwise round reached counted from the final. */
  reached: RoundFromEnd | null;
  label: string; // 'W' | 'F' | 'SF' | 'QF' | 'R16' | ... | 'Q2' | 'RR' | 'GOLD' | 'BRONZE'
  points: number;
  prize: number;
  travel: number;
  matches: PlayedMatch[];
  championId: string | null;
  championName: string | null;
  rankAfter: number | null;
  medal?: 'gold' | 'silver' | 'bronze' | null;
}

// ─── Tactics & events ────────────────────────────────────────────────────────

export interface TacticOptionView {
  tacticId: string;
  /** Expected edge in serve-point probability (e.g. 0.018 = +1.8 pp). */
  edge: number;
  /** Per-set swing (standard deviation) of the edge. */
  spread: number;
  mastery: number;
}

/** Scouting report shown before a key match. */
export interface PendingTactics {
  tournamentId: string;
  round: string;
  oppId: string;
  oppName: string;
  oppNat: string;
  oppRank: number | null;
  oppSeed: number | null;
  oppStyle: PlayStyle;
  oppHand: Hand;
  /** Opponent rating minus the player's OVR. */
  oppDelta: number;
  nemesis: boolean;
  surface: Surface;
  options: TacticOptionView[];
}

export interface TacticDeck {
  owned: string[];
  /** Card used automatically in ordinary matches. */
  preferred: string;
  record: Record<string, { played: number; won: number }>;
}

export interface TrainingPlan {
  skills: Partial<Record<SkillId, number>>;
  rest: number;
  /** Tactic card to learn (costs TACTIC_BLOCK_COST blocks). */
  learn: string | null;
  preferred: string;
}

export type EffectTarget =
  | { kind: 'skill'; skill: SkillId; delta: number }
  | { kind: 'potential'; skill: SkillId | 'all'; delta: number }
  | { kind: 'budget'; delta: number }
  | { kind: 'media'; delta: number }
  | { kind: 'reputation'; delta: number }
  | { kind: 'morale'; delta: number }
  | { kind: 'fatigue'; delta: number }
  | { kind: 'surface'; surface: SurfaceGroup; delta: number }
  | { kind: 'injury'; weeks: number; injury: InjuryKind; serious?: boolean }
  | { kind: 'coach'; coach: CoachId }
  | { kind: 'flag'; flag: string }
  | { kind: 'davis_cup' }
  | { kind: 'promote' }
  | { kind: 'turn_pro' }
  | { kind: 'exempt'; count: number }
  | { kind: 'reveal_height' }
  | { kind: 'tactic'; tactic: string }
  | { kind: 'retire_forced' };

export interface PendingEvent {
  eventId: string;
  context: 'offseason' | 'midseason';
  vars: Record<string, string | number>;
  /** Chance per option for options with a roll (null = no roll). */
  chances: (number | null)[];
  resolved: { option: number; success: boolean | null; effects: EffectTarget[] } | null;
}

// ─── Season ──────────────────────────────────────────────────────────────────

export interface SeasonSlot {
  week: number;
  span: number;
  options: string[];
}

export interface SeasonState {
  year: number;
  stage: StageId;
  form: FormId;
  slots: SeasonSlot[];
  plan: (string | null)[];
  cursor: number;
  results: TournamentResult[];
  /** Junior season standings, keyed by AI id plus 'P'. */
  standings: Record<string, number>;
  run: TournamentRun | null;
  midEventsLeft: number;
  budgetStart: number;
  started: boolean;
  /** AI players still busy in a two-week event. */
  busy: string[];
  /** Training blocks spent on rest this offseason (lowers injury risk). */
  restBlocks: number;
  /** Untracked local entrants of this week's small pro events (ITF fields, qualifiers). */
  locals: AIPlayer[];
}

export interface SeasonRecord {
  year: number;
  age: number;
  stage: StageId;
  ovr: number;
  form: FormId;
  /** Junior: season standing; pro: year-end rank. */
  rankEnd: number | null;
  points: number;
  titles: string[];
  best: string | null;
  prize: number;
  budgetEnd: number;
  legacyAfter: number;
  played: number;
  won: number;
  lost: number;
  headline: HeadlineView | null;
}

export interface HeadlineView {
  templateId: string;
  vars: Record<string, string | number>;
}

// ─── Stats & meta ────────────────────────────────────────────────────────────

export interface TitleRecord {
  year: number;
  tournamentId: string;
  level: LevelId;
  surface: Surface;
  slam: SlamId | null;
}

export interface CareerStats {
  titles: TitleRecord[];
  finals: number;
  proTitlesByLevel: Partial<Record<LevelId, number>>;
  slamBest: Record<SlamId, RoundFromEnd | null>;
  slamTitles: Record<SlamId, number>;
  slamFinals: number;
  slamSemis: number;
  slamQuarters: number;
  juniorSlamTitles: number;
  juniorYearEndNo1: boolean;
  polishChampionships: number;
  olympic: { gold: number; silver: number; bronze: number };
  davisCup: number;
  weeksAtNo1: number;
  yearEndNo1: number;
  yearEndTop10: number;
  peakRank: number | null;
  peakRankYear: number | null;
  matchesWon: number;
  matchesLost: number;
  proMatchesWon: number;
  proMatchesLost: number;
  prizeMoney: number;
  sponsorMoney: number;
  seriousInjuries: number;
  nemesisWon: number;
  nemesisLost: number;
  keyMatchesWon: number;
  bigUpsets: number;
  maxDebt: number;
  fiveSetWins: number;
  doubleBagels: number;
  qualifierTitles: number;
  wildcardTitles: number;
}

export type RetireReason = 'choice' | 'age' | 'debt' | 'injury';

export interface CareerConfig {
  name: { first: string; last: string };
  gender: Gender;
  background: BackgroundId;
  difficulty: DifficultyId;
  mode: CareerMode;
}

export type Phase =
  | { kind: 'event'; event: PendingEvent }
  | { kind: 'training' }
  | { kind: 'team' }
  | { kind: 'sponsors'; offers: SponsorOffer[] }
  | { kind: 'schedule' }
  | { kind: 'season' }
  | { kind: 'tactics'; scout: PendingTactics }
  | { kind: 'season_end'; record: SeasonRecord }
  | { kind: 'retired'; reason: RetireReason };

export interface CareerState {
  engineVersion: string;
  seed: string;
  rng: RngState;
  config: CareerConfig;
  player: PlayerState;
  team: TeamState;
  finance: FinanceState;
  sponsors: ActiveSponsor[];
  phase: Phase;
  /** Queue of offseason event ids still to show this offseason. */
  eventQueue: string[];
  season: SeasonState;
  /** Junior rivals (stage field) or the professional pool. */
  field: AIPlayer[];
  pro: {
    points: number;
    rank: number | null;
    results: [number, number][];
    exemptions: number;
    turnedProAge: number | null;
  };
  stats: CareerStats;
  tactics: TacticDeck;
  history: SeasonRecord[];
  flags: string[];
  /** Events already seen (for `once` events). */
  seenEvents: string[];
  legacy: number;
  nextId: number;
  actionCount: number;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type Action =
  | { t: 'continue' }
  | { t: 'choose'; option: number }
  | { t: 'train'; plan: TrainingPlan }
  | { t: 'team'; coach: CoachId; physio: boolean; fitnessCoach: boolean }
  | { t: 'sponsors'; accept: string[] }
  | { t: 'schedule'; plan: (string | null)[] }
  | { t: 'play' }
  | { t: 'retire' };
