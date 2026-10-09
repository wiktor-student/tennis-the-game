import {
  DAY_FORM_SD,
  LEFTY_BONUS,
  PRESSURE_MENTAL_WEIGHT,
  SURFACE_BASE,
  SURFACE_PROFICIENCY_WEIGHT,
  SURFACE_WEIGHTS,
} from '../model/constants';
import type { AIPlayer, MatchScore, PlayStyle, SetScore, Skills, Surface } from '../model/types';
import type { Rng } from '../rng';

/**
 * Tennis match model.
 *
 * Each competitor is reduced to composite ratings (serve, return, rally, mental, fitness).
 * The probability that the server wins a point is derived from the difference between the
 * server's serve rating and the receiver's return rating, plus the rally difference, surface
 * proficiency, form, momentum and fatigue. Points build games, games build sets — with
 * tie-breaks at 6:6 and a match tie-break to 10 in deciding sets of Grand Slams.
 */
export interface Competitor {
  serve: number;
  ret: number;
  rally: number;
  mental: number;
  fitness: number;
  /** Surface proficiency 0–100 for the match surface. */
  surface: number;
  lefty: boolean;
  /** Additive point-probability bonus (form + day form + momentum − fatigue). */
  bonus: number;
}

export interface MatchSetup {
  a: Competitor;
  b: Competitor;
  surface: Surface;
  bestOf: 3 | 5;
  /** Deciding set is a match tie-break to 10 at 6:6 (Grand Slam rule). */
  decidingTiebreak10: boolean;
}

export function playerCompetitor(
  skills: Skills,
  surfaceProf: number,
  lefty: boolean,
  bonus: number,
): Competitor {
  return {
    serve: 0.62 * skills.serve + 0.23 * skills.forehand + 0.15 * skills.net,
    ret: 0.55 * skills.return + 0.3 * skills.backhand + 0.15 * skills.forehand,
    rally: 0.36 * skills.forehand + 0.34 * skills.backhand + 0.3 * skills.fitness,
    mental: skills.mental,
    fitness: skills.fitness,
    surface: surfaceProf,
    lefty,
    bonus,
  };
}

const STYLE_OFFSETS: Record<
  PlayStyle,
  { serve: number; ret: number; rally: number; fitness: number }
> = {
  server: { serve: 5, ret: -3, rally: -3, fitness: -2 },
  grinder: { serve: -4, ret: 3, rally: 4, fitness: 5 },
  netrusher: { serve: 3, ret: -2, rally: -3, fitness: 0 },
  allround: { serve: 0, ret: 0, rally: 0, fitness: 0 },
};

/** Surface proficiency for an AI player: grows with age, boosted on the preferred surface. */
export function aiSurfaceProficiency(ai: AIPlayer, surface: Surface, year: number): number {
  const age = year - ai.birthYear;
  const group = surface === 'indoor' ? 'hard' : surface;
  const experience = Math.min(36, Math.max(0, (age - 8) * 2.6));
  const base = group === 'grass' ? 26 + experience : 46 + experience;
  return Math.min(95, base + (ai.surfacePref === group ? 8 : 0));
}

export function aiCompetitor(ai: AIPlayer, surface: Surface, year: number, bonus = 0): Competitor {
  const o = STYLE_OFFSETS[ai.style];
  const grassNet = ai.style === 'netrusher' && surface === 'grass' ? 2 : 0;
  return {
    serve: ai.rating + o.serve + grassNet,
    ret: ai.rating + o.ret,
    rally: ai.rating + o.rally,
    mental: ai.mental,
    fitness: ai.rating + o.fitness,
    surface: aiSurfaceProficiency(ai, surface, year),
    lefty: ai.hand === 'L',
    bonus,
  };
}

/** Probability that `server` wins a point against `receiver`. */
export function servePointProbability(
  server: Competitor,
  receiver: Competitor,
  surface: Surface,
  pressure: boolean,
): number {
  const w = SURFACE_WEIGHTS[surface];
  let p =
    SURFACE_BASE[surface] +
    (w.serve * (server.serve - receiver.ret)) / 100 +
    (w.rally * (server.rally - receiver.rally)) / 100 +
    SURFACE_PROFICIENCY_WEIGHT * (server.surface - receiver.surface) +
    server.bonus -
    receiver.bonus;
  if (server.lefty && !receiver.lefty) p += LEFTY_BONUS;
  if (pressure) p += PRESSURE_MENTAL_WEIGHT * (server.mental - receiver.mental);
  return Math.min(0.9, Math.max(0.28, p));
}

/** Closed-form probability of holding serve given a per-point probability. */
export function holdProbability(p: number): number {
  const q = 1 - p;
  const deuce = (p * p) / (1 - 2 * p * q);
  return p ** 4 * (1 + 4 * q + 10 * q * q) + 20 * p ** 3 * q ** 3 * deuce;
}

export function dayForm(rng: Rng): number {
  return rng.normal(0, DAY_FORM_SD);
}

// ─── Point-level simulation (player matches) ────────────────────────────────

interface SetContext {
  setup: MatchSetup;
  /** Extra per-set fatigue penalty already accumulated (A, B). */
  tiredA: number;
  tiredB: number;
  deciding: boolean;
}

function pointProb(ctx: SetContext, server: 'A' | 'B', pressure: boolean): number {
  const { a, b, surface } = ctx.setup;
  const A = { ...a, bonus: a.bonus - ctx.tiredA };
  const B = { ...b, bonus: b.bonus - ctx.tiredB };
  return server === 'A'
    ? servePointProbability(A, B, surface, pressure)
    : servePointProbability(B, A, surface, pressure);
}

function playGamePoints(
  rng: Rng,
  ctx: SetContext,
  server: 'A' | 'B',
  gamesA: number,
  gamesB: number,
): 'A' | 'B' {
  let s = 0;
  let r = 0;
  const lateSet = ctx.deciding && gamesA + gamesB >= 8;
  for (;;) {
    const breakPoint = r >= 3 && r > s;
    const p = pointProb(ctx, server, breakPoint || lateSet);
    if (rng.float() < p) s++;
    else r++;
    if (s >= 4 && s - r >= 2) return server;
    if (r >= 4 && r - s >= 2) return server === 'A' ? 'B' : 'A';
  }
}

function playTiebreakPoints(
  rng: Rng,
  ctx: SetContext,
  firstServer: 'A' | 'B',
  target: number,
): { winner: 'A' | 'B'; a: number; b: number } {
  let a = 0;
  let b = 0;
  let point = 0;
  for (;;) {
    // Server changes after the first point, then every two points.
    const block = Math.floor((point + 1) / 2);
    const server = block % 2 === 0 ? firstServer : firstServer === 'A' ? 'B' : 'A';
    const p = pointProb(ctx, server, true);
    const serverWins = rng.float() < p;
    const winner = serverWins ? server : server === 'A' ? 'B' : 'A';
    if (winner === 'A') a++;
    else b++;
    point++;
    if ((a >= target || b >= target) && Math.abs(a - b) >= 2)
      return { winner: a > b ? 'A' : 'B', a, b };
  }
}

// ─── Game-level simulation (AI vs AI) ───────────────────────────────────────

/** Per-set cache of hold probabilities — the fast path never re-derives them per game. */
interface FastSet {
  holdA: number;
  holdB: number;
  pA: number;
  pB: number;
}

function fastSet(ctx: SetContext): FastSet {
  const pA = pointProb(ctx, 'A', false);
  const pB = pointProb(ctx, 'B', false);
  return { pA, pB, holdA: holdProbability(pA), holdB: holdProbability(pB) };
}

function playTiebreakFast(
  rng: Rng,
  f: FastSet,
  firstServer: 'A' | 'B',
  target: number,
): { winner: 'A' | 'B'; a: number; b: number } {
  let a = 0;
  let b = 0;
  for (let point = 0; ; point++) {
    const block = Math.floor((point + 1) / 2);
    const server = block % 2 === 0 ? firstServer : firstServer === 'A' ? 'B' : 'A';
    const p = server === 'A' ? f.pA : f.pB;
    const serverWins = rng.float() < p;
    if ((server === 'A') === serverWins) a++;
    else b++;
    if ((a >= target || b >= target) && Math.abs(a - b) >= 2)
      return { winner: a > b ? 'A' : 'B', a, b };
  }
}

// ─── Sets & matches ─────────────────────────────────────────────────────────

export interface SetOutcome {
  score: SetScore;
  winner: 'A' | 'B';
  /** Who serves first in the following set. */
  nextServer: 'A' | 'B';
}

export function simulateSet(
  rng: Rng,
  setup: MatchSetup,
  firstServer: 'A' | 'B',
  setIndex: number,
  deciding: boolean,
  detailed: boolean,
): SetOutcome {
  const tiredness = (fitness: number) => Math.max(0, 70 - fitness) * 0.0005 * setIndex;
  const ctx: SetContext = {
    setup,
    tiredA: tiredness(setup.a.fitness),
    tiredB: tiredness(setup.b.fitness),
    deciding,
  };
  let ga = 0;
  let gb = 0;
  let server = firstServer;
  const fast = detailed ? null : fastSet(ctx);
  for (;;) {
    if (ga === 6 && gb === 6) {
      const target = deciding && setup.decidingTiebreak10 ? 10 : 7;
      const tb = fast
        ? playTiebreakFast(rng, fast, server, target)
        : playTiebreakPoints(rng, ctx, server, target);
      const winner = tb.winner;
      const score: SetScore =
        winner === 'A'
          ? { a: 7, b: 6, tb: Math.min(tb.a, tb.b) }
          : { a: 6, b: 7, tb: Math.min(tb.a, tb.b) };
      // The player who received first in the tie-break serves first in the next set.
      return { score, winner, nextServer: server === 'A' ? 'B' : 'A' };
    }
    const winner = fast
      ? rng.float() < (server === 'A' ? fast.holdA : fast.holdB)
        ? server
        : server === 'A'
          ? 'B'
          : 'A'
      : playGamePoints(rng, ctx, server, ga, gb);
    if (winner === 'A') ga++;
    else gb++;
    server = server === 'A' ? 'B' : 'A';
    if ((ga >= 6 || gb >= 6) && Math.abs(ga - gb) >= 2) {
      return { score: { a: ga, b: gb, tb: null }, winner: ga > gb ? 'A' : 'B', nextServer: server };
    }
  }
}

export function setsWon(sets: SetScore[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const s of sets) {
    if (s.a > s.b) a++;
    else b++;
  }
  return { a, b };
}

export function matchWinner(sets: SetScore[], bestOf: 3 | 5): 'A' | 'B' | null {
  const need = bestOf === 5 ? 3 : 2;
  const w = setsWon(sets);
  if (w.a >= need) return 'A';
  if (w.b >= need) return 'B';
  return null;
}

/**
 * Continue a match from `sets` until it ends or until `stopAfterSets` sets have been played.
 */
export function continueMatch(
  rng: Rng,
  setup: MatchSetup,
  sets: SetScore[],
  nextServer: 'A' | 'B',
  detailed: boolean,
  stopAfterSets?: number,
): { sets: SetScore[]; nextServer: 'A' | 'B'; winner: 'A' | 'B' | null } {
  const out = [...sets];
  let server = nextServer;
  for (;;) {
    const winner = matchWinner(out, setup.bestOf);
    if (winner) return { sets: out, nextServer: server, winner };
    if (stopAfterSets !== undefined && out.length >= stopAfterSets) {
      return { sets: out, nextServer: server, winner: null };
    }
    const w = setsWon(out);
    const need = setup.bestOf === 5 ? 3 : 2;
    const deciding = w.a === need - 1 && w.b === need - 1;
    const set = simulateSet(rng, setup, server, out.length, deciding, detailed);
    out.push(set.score);
    server = set.nextServer;
  }
}

/** Quick AI-vs-AI match. Returns 'A' or 'B' plus the score. */
export function quickMatch(rng: Rng, setup: MatchSetup): { winner: 'A' | 'B'; score: MatchScore } {
  const first = rng.chance(0.5) ? 'A' : 'B';
  const result = continueMatch(rng, setup, [], first, false);
  return { winner: result.winner ?? 'A', score: { sets: result.sets, retired: null } };
}

/** Score text from A's perspective, e.g. "6-4 3-6 7-6(5)". */
export function scoreText(score: MatchScore, perspective: 'A' | 'B' = 'A'): string {
  if (score.walkover) return 'w/o';
  const parts = score.sets.map((s) => {
    const mine = perspective === 'A' ? s.a : s.b;
    const theirs = perspective === 'A' ? s.b : s.a;
    return s.tb !== null ? `${mine}-${theirs}(${s.tb})` : `${mine}-${theirs}`;
  });
  const text = parts.join(' ');
  return score.retired ? `${text} ret.` : text;
}
