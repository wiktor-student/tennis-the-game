import { foreignName, mixedName, polishName, type GeneratedName } from '../content/names';
import { STAGES } from '../content/stages';
import {
  BASE_GROWTH,
  PRO_POOL_SIZE,
  RANKING_BEST_OF,
  START_AGE,
  START_YEAR,
  WEEKS_PER_YEAR,
  ageDecline,
  ageGrowthFactor,
} from '../model/constants';
import type {
  AIPlayer,
  CareerState,
  Gender,
  PlayStyle,
  StageId,
  SurfaceGroup,
} from '../model/types';
import type { Rng } from '../rng';

const STYLES: PlayStyle[] = ['server', 'grinder', 'allround', 'netrusher'];
const STYLE_WEIGHTS: Record<PlayStyle, number> = {
  server: 3,
  grinder: 4,
  allround: 5,
  netrusher: 1,
};
const SURFACES: (SurfaceGroup | null)[] = ['clay', 'hard', 'grass', null];

export function globalWeek(year: number, week: number): number {
  return (year - START_YEAR) * WEEKS_PER_YEAR + week;
}

function newId(state: CareerState): string {
  state.nextId += 1;
  return `a${state.nextId}`;
}

function baseAI(
  state: CareerState,
  rng: Rng,
  name: GeneratedName,
  birthYear: number,
  rating: number,
  potential: number,
): AIPlayer {
  const style = rng.weighted(STYLES, (s) => STYLE_WEIGHTS[s]);
  return {
    id: newId(state),
    first: name.first,
    last: name.last,
    nat: name.nat,
    birthYear,
    rating: round1(rating),
    potential: round1(Math.min(97, potential)),
    style,
    surfacePref: rng.weighted(SURFACES, (s) => (s === 'grass' ? 1 : s === null ? 3 : 3)),
    hand: rng.chance(0.12) ? 'L' : 'R',
    mental: round1(rating + rng.normal(0, 5)),
    results: [],
    points: 0,
    rank: null,
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * Grow a junior rating from age 8 to `age` using the same curve the player follows,
 * so newly introduced rivals are consistent with existing ones.
 */
function juniorRatingAt(rng: Rng, potential: number, age: number): number {
  let rating = rng.normal(24, 4);
  for (let a = START_AGE; a < age; a++) {
    rating +=
      Math.max(0, potential - rating) * BASE_GROWTH * ageGrowthFactor(a) * rng.range(0.8, 1.2);
  }
  return rating;
}

function juniorPotential(rng: Rng, stage: StageId): number {
  // Higher stages attract a stronger, more international field.
  const mean = { mini: 70, national: 72, europe: 76, itf_junior: 80, pro: 80 }[stage];
  return Math.min(96, Math.max(50, rng.normal(mean, 8)));
}

export function createJuniorRival(
  state: CareerState,
  rng: Rng,
  stage: StageId,
  gender: Gender,
): AIPlayer {
  const birthYear = state.player.birthYear + rng.int(-1, 0) + (rng.chance(0.3) ? 1 : 0);
  const potential = juniorPotential(rng, stage);
  const rating = juniorRatingAt(rng, potential, state.season.year - birthYear);
  const name =
    stage === 'mini' || stage === 'national'
      ? polishName(rng, gender)
      : stage === 'europe'
        ? mixedName(rng, gender, 0.2)
        : mixedName(rng, gender, 0.07);
  return baseAI(state, rng, name, birthYear, rating, potential);
}

/** Build (or rebuild) the junior field for a stage, carrying over the best rivals. */
export function buildJuniorField(state: CareerState, rng: Rng, stage: StageId): AIPlayer[] {
  const def = STAGES[stage];
  const gender = state.config.gender;
  const carry = { mini: 0, national: 12, europe: 9, itf_junior: 16, pro: 0 }[stage];
  const previous = [...state.field].sort(
    (a, b) => Number(!!b.nemesis) - Number(!!a.nemesis) || b.rating - a.rating,
  );
  const kept = previous.slice(0, carry);
  const field: AIPlayer[] = [...kept];
  while (field.length < def.fieldSize) field.push(createJuniorRival(state, rng, stage, gender));
  return field;
}

/** Yearly development of an AI player. */
export function developAI(ai: AIPlayer, rng: Rng, year: number): void {
  const age = year - ai.birthYear;
  const growth = ageGrowthFactor(age);
  if (growth > 0) {
    ai.rating += Math.max(0, ai.potential - ai.rating) * BASE_GROWTH * growth * rng.range(0.7, 1.3);
  }
  const decline = ageDecline(age);
  if (decline.skills > 0)
    ai.rating -= (decline.skills * 0.7 + decline.fitness * 0.3) * rng.range(0.6, 1.4);
  ai.rating = round1(Math.max(10, Math.min(97, ai.rating)));
  ai.mental = round1(
    Math.max(10, Math.min(99, ai.mental + (ai.rating - ai.mental) * 0.2 + rng.normal(0, 1))),
  );
}

// ─── Professional pool ───────────────────────────────────────────────────────

/** Rating expected at a given world ranking position. */
export function ratingForRank(rank: number): number {
  const lg = Math.log10(rank);
  return 94.5 - 7 * lg - 3 * Math.max(0, lg - 1.8) ** 2;
}

/** Points expected at a given world ranking position. */
export function pointsForRank(rank: number): number {
  return Math.round(10500 * rank ** -0.82);
}

/**
 * Create the professional pool when the player turns pro. Former junior rivals join as
 * unranked young professionals. Synthetic results spread over the previous 52 weeks give
 * everybody a realistic starting ranking that rolls off naturally.
 */
export function buildProPool(state: CareerState, rng: Rng): AIPlayer[] {
  const year = state.season.year;
  const gender = state.config.gender;
  const pool: AIPlayer[] = [];
  const rivals = [...state.field]
    .sort((a, b) => Number(!!b.nemesis) - Number(!!a.nemesis) || b.rating - a.rating)
    .slice(0, 24);

  const veterans = PRO_POOL_SIZE - rivals.length;
  const ratings: number[] = [];
  for (let i = 1; i <= veterans; i++) ratings.push(ratingForRank(i) + rng.normal(0, 1.4));
  ratings.sort((a, b) => b - a);

  const gwNow = globalWeek(year, 0);
  for (let i = 0; i < ratings.length; i++) {
    const rating = ratings[i] as number;
    const age = Math.round(Math.min(35, Math.max(19, rng.normal(26.5, 3.6))));
    const potential = rating + Math.max(0, 26 - age) * 1.2 + rng.range(0, 2);
    const ai = baseAI(state, rng, foreignOrPolish(rng, gender), year - age, rating, potential);
    seedResults(ai, pointsForRank(i + 1) * rng.range(0.85, 1.15), gwNow, rng);
    pool.push(ai);
  }
  for (const rival of rivals) {
    rival.rival = true;
    rival.results = [];
    seedResults(rival, rng.range(0, 25), gwNow, rng);
    pool.push(rival);
  }
  return pool;
}

function foreignOrPolish(rng: Rng, gender: Gender): GeneratedName {
  return rng.chance(0.04) ? polishName(rng, gender) : foreignName(rng, gender);
}

function seedResults(ai: AIPlayer, total: number, gwNow: number, rng: Rng): void {
  const count = 16;
  const results: [number, number][] = [];
  // Chronological order (oldest first) — pruning relies on it.
  for (let i = count - 1; i >= 0; i--) {
    const week = gwNow - Math.floor(((i + 0.5) * WEEKS_PER_YEAR) / count);
    results.push([week, Math.max(0, Math.round((total / count) * rng.range(0.4, 1.6)))]);
  }
  ai.results = results;
  ai.points = sumBest(results, gwNow);
}

/** Drop results older than 52 weeks. Results are stored oldest first. */
function prune(results: [number, number][], gwNow: number): void {
  const cutoff = gwNow - WEEKS_PER_YEAR;
  let drop = 0;
  while (drop < results.length && (results[drop] as [number, number])[0] <= cutoff) drop++;
  if (drop > 0) results.splice(0, drop);
}

/** Sum of the best RANKING_BEST_OF results inside the 52-week window ending at gwNow. */
export function sumBest(results: [number, number][], gwNow: number): number {
  const cutoff = gwNow - WEEKS_PER_YEAR;
  let count = 0;
  let sum = 0;
  for (const r of results) {
    if (r[0] > cutoff && r[0] <= gwNow) {
      count++;
      sum += r[1];
    }
  }
  if (count <= RANKING_BEST_OF) return sum;
  if (scratch.length < count) scratch = new Float64Array(count * 2);
  let n = 0;
  for (const r of results) if (r[0] > cutoff && r[0] <= gwNow) scratch[n++] = r[1];
  const view = scratch.subarray(0, n).sort();
  sum = 0;
  for (let i = n - RANKING_BEST_OF; i < n; i++) sum += view[i] as number;
  return sum;
}

/** Reusable buffer for sumBest — numeric typed-array sort, no per-call allocation. */
let scratch = new Float64Array(128);

/** Recompute the rolling ranking for the pool and the player. */
export function updateRankings(state: CareerState, gwNow: number): void {
  const entries: { id: string; points: number; rating: number }[] = [];
  for (const ai of state.field) {
    prune(ai.results, gwNow);
    ai.points = sumBest(ai.results, gwNow);
    entries.push({ id: ai.id, points: ai.points, rating: ai.rating });
  }
  prune(state.pro.results, gwNow);
  state.pro.points = sumBest(state.pro.results, gwNow);
  entries.push({ id: 'P', points: state.pro.points, rating: 0 });

  entries.sort((a, b) => b.points - a.points || b.rating - a.rating);
  const rankById = new Map<string, number | null>();
  entries.forEach((e, i) => rankById.set(e.id, e.points > 0 ? i + 1 : null));
  for (const ai of state.field) ai.rank = rankById.get(ai.id) ?? null;
  state.pro.rank = rankById.get('P') ?? null;

  // Below the simulated pool the ranking is extrapolated from points (the real list is ~2000 long).
  if (state.pro.rank !== null) {
    const extrapolated = rankFromPoints(state.pro.points);
    if (extrapolated > 300) state.pro.rank = Math.max(state.pro.rank, extrapolated);
  }
}

/** Inverse of `pointsForRank` — used for players below the simulated pool. */
export function rankFromPoints(points: number): number {
  if (points <= 0) return 2500;
  return Math.min(2500, Math.round((10500 / points) ** (1 / 0.82)));
}

/** End-of-season churn for the pro pool: development, retirements and newcomers. */
export function evolveProPool(state: CareerState, rng: Rng, nextYear: number): void {
  const gender = state.config.gender;
  const survivors: AIPlayer[] = [];
  for (const ai of state.field) {
    developAI(ai, rng, nextYear);
    const age = nextYear - ai.birthYear;
    const retireChance =
      age >= 30 ? 0.08 + (age - 30) * 0.07 : ai.rating < 64 && age > 25 ? 0.25 : 0;
    if (ai.nemesis && age < 34) {
      survivors.push(ai);
      continue;
    }
    if (rng.chance(retireChance) || age >= 38) continue;
    survivors.push(ai);
  }
  while (survivors.length < PRO_POOL_SIZE) {
    const age = rng.int(18, 20);
    const potential = Math.min(96, rng.normal(80, 6));
    const rating = Math.min(potential, rng.normal(68, 3.5));
    survivors.push(
      baseAI(state, rng, foreignOrPolish(rng, gender), nextYear - age, rating, potential),
    );
  }
  calibratePool(survivors);
  state.field = survivors;
}

/**
 * Keep the tour's strength curve stable across decades: individual players still rise and
 * fall relative to each other, but the distribution is pulled towards `ratingForRank`.
 */
export function calibratePool(pool: AIPlayer[]): void {
  const sorted = [...pool].sort((a, b) => b.rating - a.rating);
  sorted.forEach((ai, i) => {
    const target = ratingForRank(i + 1);
    const delta = (target - ai.rating) * 0.6;
    ai.rating = round1(ai.rating + delta);
    ai.potential = round1(Math.max(ai.potential + delta, ai.rating));
    ai.mental = round1(ai.mental + delta);
  });
}

const byIdCache = new WeakMap<AIPlayer[], { size: number; map: Map<string, AIPlayer> }>();

/** id → player map, cached per field array (field arrays are replaced, never resized in place). */
export function aiById(state: CareerState): Map<string, AIPlayer> {
  const cached = byIdCache.get(state.field);
  if (cached && cached.size === state.field.length) return cached.map;
  const map = new Map(state.field.map((ai) => [ai.id, ai]));
  byIdCache.set(state.field, { size: state.field.length, map });
  return map;
}

export function displayName(ai: Pick<AIPlayer, 'first' | 'last'>): string {
  return `${ai.first} ${ai.last}`;
}
