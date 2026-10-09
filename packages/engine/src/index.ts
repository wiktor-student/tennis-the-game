/**
 * @ttg/engine — public API.
 *
 * The engine is a pure, deterministic reducer: `createCareer(config, seed)` builds the initial
 * state and `step(state, action)` produces the next one. All randomness comes from the seeded
 * RNG stored in the state, so `replay(config, seed, actions)` reproduces a career exactly.
 */
export { ENGINE_VERSION } from './version';
export { Rng, hashSeed, type RngState } from './rng';
export { l, tr, fill, genderize, type L, type Locale } from './i18n';

export * from './model/types';
export type { CareerSummary } from './model/summary';
export * from './model/constants';
export {
  SKILL_IDS,
  SKILL_INFO,
  SKILL_WEIGHTS,
  SURFACE_INFO,
  overall,
  surfaceGroup,
} from './model/skills';

export {
  EngineError,
  applyAction,
  canRetire,
  createCareer,
  isFinished,
  replay,
  step,
  suggestName,
} from './career';

export {
  buildSummary,
  computeLegacy,
  legacyMultiplier,
  legacyRaw,
  achievementsFor,
} from './sim/legacy';
export { autoPlan, juniorRank, juniorStandings, validatePlan } from './sim/season';
export { projectEntry, wildcardChance, PLAYER_ID } from './sim/tournament';
export { equipmentCost, marketability, staffCost, travelCost } from './sim/economy';
export { trainingGain } from './sim/development';
export { displayName } from './sim/field';

export {
  dailyCareer,
  dailyGoals,
  goalProgress,
  isoWeekKey,
  warsawDayKey,
  weeklyChallenge,
  weeklyDone,
  type DailyGoal,
} from './meta/daily';

// Content
export { ACHIEVEMENTS, evaluateAchievements, type AchievementDef } from './content/achievements';
export { BACKGROUNDS, DIFFICULTIES, FAMILY_SUPPORT } from './content/backgrounds';
export { COACHES, COACH_ORDER, FITNESS_COACH, PHYSIO } from './content/coaches';
export { EVENTS, EVENTS_BY_ID, type StoryEvent, type StoryOption } from './content/events';
export { GOAL_TEMPLATES, WEEKLY_TEMPLATES } from './content/goals';
export { HEADLINES, OUTLETS } from './content/headlines';
export { LEVELS, pointsFor, prizeFor, roundLabel, type LevelDef } from './content/levels';
export { RACKETS, type RacketDef } from './content/rackets';
export { SITUATIONS, SITUATIONS_BY_ID, type Situation } from './content/situations';
export { SPONSORS, SPONSOR_CATEGORY_NAME } from './content/sponsors';
export { STAGES, stageForAge } from './content/stages';
export { TOURNAMENTS, tournament } from './content/tournaments';
export { VERDICTS, VERDICTS_BY_ID, verdictFor } from './content/verdicts';
