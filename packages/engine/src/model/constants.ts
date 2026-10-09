/** Simulation constants. Every balancing number lives here or in content/. */

export const START_YEAR = 2026;
export const START_AGE = 8;
export const MAX_AGE = 38;
export const MIN_RETIRE_AGE = 28;
export const PRO_AGE = 18;
export const WEEKS_PER_YEAR = 52;

/** Number of best results that count towards the professional ranking. */
export const RANKING_BEST_OF = 19;

export const PRO_POOL_SIZE = 420;

export const DEBT_LIMIT_JUNIOR = -60_000;
export const DEBT_LIMIT_PRO = -150_000;

/** Base server point-win probability by surface. */
export const SURFACE_BASE = {
  clay: 0.57,
  hard: 0.61,
  indoor: 0.63,
  grass: 0.65,
} as const;

/** Weight of serve-vs-return and rally differences by surface. */
export const SURFACE_WEIGHTS = {
  clay: { serve: 0.17, rally: 0.21 },
  hard: { serve: 0.22, rally: 0.15 },
  indoor: { serve: 0.25, rally: 0.13 },
  grass: { serve: 0.27, rally: 0.11 },
} as const;

export const SURFACE_PROFICIENCY_WEIGHT = 0.001;
export const PRESSURE_MENTAL_WEIGHT = 0.0015;
export const DAY_FORM_SD = 0.018;
export const LEFTY_BONUS = 0.012;

export const FORM_BONUS = {
  crisis: -0.02,
  weak: -0.01,
  normal: 0,
  good: 0.007,
  great: 0.014,
  life: 0.022,
} as const;

export const FORM_WEIGHTS = {
  crisis: 6,
  weak: 16,
  normal: 38,
  good: 24,
  great: 12,
  life: 4,
} as const;

/** Momentum applied after a match decision, by outcome. */
export const MOMENTUM = {
  safe: { super: 0.055, success: 0.025, fail: -0.04 },
  risky: { super: 0.085, success: 0.045, fail: -0.06 },
} as const;

export const SUPER_SHARE = { safe: 0.07, risky: 0.18 } as const;

/** Growth rate multiplier by age (applied to the gap between skill and potential). */
export function ageGrowthFactor(age: number): number {
  if (age <= 12) return 1.0;
  if (age <= 16) return 1.15;
  if (age <= 20) return 1.0;
  if (age <= 24) return 0.75;
  if (age <= 28) return 0.35;
  return 0;
}

/** Absolute decline per season (positive number) after the peak years. */
export function ageDecline(age: number): { skills: number; fitness: number } {
  if (age <= 28) return { skills: 0, fitness: 0 };
  if (age <= 31) return { skills: 0.8, fitness: 1.8 };
  if (age <= 34) return { skills: 1.6, fitness: 2.8 };
  return { skills: 2.4, fitness: 3.6 };
}

export const BASE_GROWTH = 0.14;

/** PLN per USD for prize money conversions. */
export const USD_PLN = 4.0;
