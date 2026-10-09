import { DIFFICULTIES } from '../content/backgrounds';
import { PHYSIO } from '../content/coaches';
import { LEVELS, pointsFor, prizeFor, roundLabel, type LevelDef } from '../content/levels';
import { tournament } from '../content/tournaments';
import { l } from '../i18n';
import { FORM_BONUS } from '../model/constants';
import { surfaceGroup } from '../model/skills';
import type {
  AIPlayer,
  CareerState,
  EntryType,
  InjuryKind,
  MatchProgress,
  MatchScore,
  PlayedMatch,
  TournamentDef,
  TournamentResult,
  TournamentRun,
} from '../model/types';
import type { Rng } from '../rng';
import { buildDecision } from './decisions';
import { addLedger, prizeShare, travelCost } from './economy';
import { surfaceExperience } from './development';
import { aiById, displayName, globalWeek } from './field';
import {
  aiCompetitor,
  continueMatch,
  dayForm,
  matchWinner,
  playerCompetitor,
  quickMatch,
  scoreText,
  setsWon,
  type Competitor,
  type MatchSetup,
} from './match';

export const PLAYER_ID = 'P';

// ─── Draws ───────────────────────────────────────────────────────────────────

/** Natural seed number for every bracket position (1 vs n, n/2+1 vs n/2, ...). */
export function seedOrder(n: number): number[] {
  let order = [1];
  while (order.length < n) {
    const m = order.length * 2;
    order = order.flatMap((x) => [x, m + 1 - x]);
  }
  return order;
}

/**
 * Build a bracket from entrants sorted best-first. Top seeds are placed at their natural
 * positions (groups 3–4, 5–8, 9–16 shuffled), byes go to the top seeds.
 */
export function buildDraw(
  rng: Rng,
  entrants: string[],
  drawSize: number,
): { draw: (string | null)[]; seeds: Record<string, number> } {
  const order = seedOrder(drawSize);
  const count = Math.min(entrants.length, drawSize);
  const seedCount = Math.min(Math.max(2, drawSize / 4), count);
  const draw: (string | null)[] = new Array(drawSize).fill(null);
  const seeds: Record<string, number> = {};
  const positionOf = new Map<number, number>();
  order.forEach((natural, pos) => positionOf.set(natural, pos));

  // Seeds in groups: [1], [2], [3,4], [5..8], [9..16], [17..32]
  let next = 1;
  const groups: number[][] = [];
  for (let size = 1; next <= seedCount; size = next <= 2 ? 1 : size * 2) {
    const group: number[] = [];
    for (let i = 0; i < size && next <= seedCount; i++) group.push(next++);
    groups.push(group);
  }
  for (const group of groups) {
    const slots = rng.shuffle([...group]);
    group.forEach((seed, i) => {
      const id = entrants[seed - 1] as string;
      draw[positionOf.get(slots[i] as number) as number] = id;
      seeds[id] = seed;
    });
  }
  // Unseeded entrants fill positions with natural numbers in (seedCount, count].
  const open: number[] = [];
  for (let natural = seedCount + 1; natural <= count; natural++) open.push(positionOf.get(natural) as number);
  rng.shuffle(open);
  const unseeded = entrants.slice(seedCount, count);
  unseeded.forEach((id, i) => {
    draw[open[i] as number] = id;
  });
  return { draw, seeds };
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface Ctx {
  state: CareerState;
  rng: Rng;
  def: TournamentDef;
  level: LevelDef;
  ai: Map<string, AIPlayer>;
  bestOf: 3 | 5;
}

function makeCtx(state: CareerState, rng: Rng, def: TournamentDef): Ctx {
  const level = LEVELS[def.level];
  const bestOf: 3 | 5 = level.bestOfFiveMen && state.config.gender === 'M' ? 5 : 3;
  return { state, rng, def, level, ai: aiById(state), bestOf };
}

function aiComp(ctx: Ctx, id: string, bonus = 0): Competitor {
  const ai = ctx.ai.get(id);
  if (!ai) throw new Error(`Unknown AI ${id}`);
  return aiCompetitor(ai, ctx.def.surface, ctx.state.season.year, bonus);
}

function strength(ctx: Ctx, id: string): number {
  if (id === PLAYER_ID) return 0;
  return ctx.ai.get(id)?.rating ?? 0;
}

function quickAI(ctx: Ctx, a: string, b: string): string {
  const setup: MatchSetup = {
    a: aiComp(ctx, a, dayForm(ctx.rng) * 0.8),
    b: aiComp(ctx, b, dayForm(ctx.rng) * 0.8),
    surface: ctx.def.surface,
    bestOf: ctx.bestOf,
    decidingTiebreak10: ctx.def.level === 'gs',
  };
  return quickMatch(ctx.rng, setup).winner === 'A' ? a : b;
}

// ─── Entry ───────────────────────────────────────────────────────────────────

export function wildcardChance(state: CareerState, def: TournamentDef): number {
  const level = LEVELS[def.level];
  if (!level.pro || def.level === 'finals' || def.level === 'olympics') return 0;
  const p = state.player;
  let chance = 0.03 + p.media * 0.004 + p.reputation * 0.003 - level.wildcardPenalty;
  if (def.country === 'PL') chance += 0.45 + (state.flags.includes('polish_wc') ? 0.3 : 0);
  return Math.max(0, Math.min(0.9, Math.round(chance * 100) / 100));
}

export type EntryProjection = 'direct' | 'qualifier' | 'wildcard' | 'exempt' | 'none';

/** Entry status with the player's current ranking (used by the planner and at play time). */
export function projectEntry(state: CareerState, def: TournamentDef): { status: EntryProjection; wildcard: number } {
  const level = LEVELS[def.level];
  if (!level.pro) return { status: 'direct', wildcard: 0 };
  const rank = state.pro.rank ?? 99_999;
  const wildcard = wildcardChance(state, def);
  if (def.level === 'finals') return { status: rank <= 8 ? 'direct' : 'none', wildcard: 0 };
  if (def.level === 'olympics') return { status: rank <= level.cutoffMain ? 'direct' : 'none', wildcard: 0 };
  if (rank <= level.cutoffMain) return { status: 'direct', wildcard };
  if (state.pro.exemptions > 0 && ['ch175', 'ch125', 'ch75'].includes(def.level)) {
    return { status: 'exempt', wildcard };
  }
  if (level.qualRounds > 0 && rank <= level.cutoffQual) return { status: 'qualifier', wildcard };
  if (wildcard > 0) return { status: 'wildcard', wildcard };
  return { status: 'none', wildcard: 0 };
}

// ─── Weekly AI distribution (pro) ────────────────────────────────────────────

function rankKey(ai: AIPlayer): number {
  return ai.rank ?? 10_000 - ai.rating;
}

/**
 * Distribute AI professionals across a week's events: the best-ranked available players go to
 * the most prestigious event, top players skip small events more often.
 */
export function assignWeek(
  state: CareerState,
  rng: Rng,
  events: TournamentDef[],
  excluded: Set<string>,
): { byEvent: Map<string, string[]>; leftover: string[] } {
  const result = new Map<string, string[]>();
  const sortedEvents = [...events].sort((a, b) => LEVELS[b.level].prestige - LEVELS[a.level].prestige);
  const majorWeek = events.some((e) => ['gs', 'm1000', 'olympics', 'finals'].includes(e.level));
  const available = state.field
    .filter((ai) => !excluded.has(ai.id))
    .filter((ai) => {
      const r = ai.rank ?? 9999;
      const p = majorWeek ? 0.95 : r <= 30 ? 0.5 : r <= 300 ? 0.78 : 0.82;
      return rng.chance(p);
    })
    .sort((a, b) => rankKey(a) - rankKey(b));

  const used = new Set<string>();
  for (const event of sortedEvents) {
    const level = LEVELS[event.level];
    let size = level.drawSize;
    if (event.level === 'olympics') size = 64;
    const entrants: string[] = [];
    for (const ai of available) {
      if (entrants.length >= size) break;
      if (used.has(ai.id)) continue;
      if (event.level === 'finals' && entrants.length >= 8) break;
      entrants.push(ai.id);
      used.add(ai.id);
    }
    result.set(event.id, entrants);
  }
  // Only the lower half of the tour fills the off-screen ITF weeks.
  const leftover = available.filter((ai) => !used.has(ai.id) && (ai.rank ?? 9999) > 200).map((ai) => ai.id);
  return { byEvent: result, leftover };
}

/**
 * The real tour runs a dozen ITF events every week. Players without a slot in the visible
 * events play these off-screen brackets (rating-based, one roll per match) so that the whole
 * pool keeps earning points and the ranking stays realistic.
 */
export function simulateVirtualEvents(state: CareerState, rng: Rng, ids: string[], week: number): void {
  const ai = aiById(state);
  const gw = globalWeek(state.season.year, week);
  for (let g = 0; g * 32 < ids.length; g++) {
    const group = ids.slice(g * 32, g * 32 + 32);
    if (group.length < 8) break;
    const level = LEVELS[g < 2 ? 'itf25' : 'itf15'];
    let bracket: string[] = rng.shuffle([...group]);
    let rounds = Math.ceil(Math.log2(bracket.length));
    while (bracket.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < bracket.length; i += 2) {
        const a = bracket[i] as string;
        const b = bracket[i + 1];
        if (!b) {
          next.push(a);
          continue;
        }
        const ra = ai.get(a)?.rating ?? 0;
        const rb = ai.get(b)?.rating ?? 0;
        const winner = rng.float() < 1 / (1 + Math.exp(-(ra - rb) / 7.5)) ? a : b;
        const loser = winner === a ? b : a;
        const pts = level.points[rounds] ?? 0;
        if (pts > 0) ai.get(loser)?.results.push([gw, pts]);
        next.push(winner);
      }
      bracket = next;
      rounds -= 1;
    }
    const champ = bracket[0];
    if (champ) ai.get(champ)?.results.push([gw, level.points[0] ?? 0]);
  }
}

// ─── Junior entrants ─────────────────────────────────────────────────────────

export function juniorEntrants(state: CareerState, rng: Rng, def: TournamentDef, withPlayer: boolean): string[] {
  const size = LEVELS[def.level].drawSize - (withPlayer ? 1 : 0);
  let ids = state.field.map((ai) => ai.id);
  if (ids.length > size) {
    const pool = [...state.field];
    const chosen: string[] = [];
    while (chosen.length < size && pool.length > 0) {
      const pick = rng.weighted(pool, (ai) => Math.max(1, ai.rating - 30) ** 2);
      chosen.push(pick.id);
      pool.splice(pool.indexOf(pick), 1);
    }
    ids = chosen;
  }
  const standings = state.season.standings;
  const ai = aiById(state);
  return ids.sort(
    (a, b) =>
      (standings[b] ?? 0) - (standings[a] ?? 0) || (ai.get(b)?.rating ?? 0) - (ai.get(a)?.rating ?? 0),
  );
}

// ─── AI-only tournaments ─────────────────────────────────────────────────────

/** Simulate a whole tournament without the player. Returns roundFromEnd per participant. */
export function simulateAITournament(
  state: CareerState,
  rng: Rng,
  def: TournamentDef,
  entrants: string[],
): { reached: Record<string, number>; champion: string | null; rrWins: Record<string, number> } {
  const ctx = makeCtx(state, rng, def);
  const reached: Record<string, number> = {};
  const rrWins: Record<string, number> = {};
  if (entrants.length < 2) return { reached, champion: entrants[0] ?? null, rrWins };

  let bracket: (string | null)[];
  if (def.level === 'finals') {
    const field = entrants.slice(0, 8);
    const a = [field[0], field[3], field[4], field[7]].filter(Boolean) as string[];
    const b = [field[1], field[2], field[5], field[6]].filter(Boolean) as string[];
    const qualifiers: string[][] = [];
    for (const group of [a, b]) {
      for (const id of group) rrWins[id] = 0;
      for (const [i, j] of RR_PAIRINGS.flat()) {
        const x = group[i];
        const y = group[j];
        if (!x || !y) continue;
        const w = quickAI(ctx, x, y);
        rrWins[w] = (rrWins[w] ?? 0) + 1;
      }
      const sorted = [...group].sort((x, y) => (rrWins[y] ?? 0) - (rrWins[x] ?? 0) || strength(ctx, y) - strength(ctx, x));
      for (const id of sorted.slice(2)) reached[id] = 3;
      qualifiers.push(sorted.slice(0, 2));
    }
    bracket = [qualifiers[0]?.[0] ?? null, qualifiers[1]?.[1] ?? null, qualifiers[1]?.[0] ?? null, qualifiers[0]?.[1] ?? null];
  } else {
    bracket = buildDraw(rng, entrants, LEVELS[def.level].drawSize).draw;
  }

  let rounds = Math.log2(bracket.length);
  while (bracket.length > 1) {
    const next: (string | null)[] = [];
    for (let i = 0; i < bracket.length; i += 2) {
      const a = bracket[i] ?? null;
      const b = bracket[i + 1] ?? null;
      if (a && b) {
        const w = quickAI(ctx, a, b);
        reached[w === a ? b : a] = rounds;
        next.push(w);
      } else next.push(a ?? b);
    }
    bracket = next;
    rounds -= 1;
  }
  const champion = bracket[0] ?? null;
  if (champion) reached[champion] = 0;
  return { reached, champion, rrWins };
}

const RR_PAIRINGS: [number, number][][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

/** Points an AI earns for a round reached (season finals use round-robin wins). */
export function aiPoints(def: TournamentDef, reached: number, rrWins = 0): number {
  const level = LEVELS[def.level];
  if (def.level === 'finals') {
    return rrWins * 200 + (reached <= 1 ? 400 : 0) + (reached === 0 ? 500 : 0);
  }
  return pointsFor(level, reached);
}

export function awardAI(state: CareerState, def: TournamentDef, reached: Record<string, number>, rrWins: Record<string, number> = {}): void {
  const level = LEVELS[def.level];
  if (level.pro) {
    const gw = globalWeek(state.season.year, def.week);
    const ai = aiById(state);
    for (const [id, r] of Object.entries(reached)) {
      if (id === PLAYER_ID) continue;
      const pts = aiPoints(def, r, rrWins[id] ?? 0);
      if (pts > 0) ai.get(id)?.results.push([gw, pts]);
    }
  } else {
    for (const [id, r] of Object.entries(reached)) {
      if (id === PLAYER_ID) continue;
      state.season.standings[id] = (state.season.standings[id] ?? 0) + pointsFor(level, r);
    }
  }
}

// ─── Player run ──────────────────────────────────────────────────────────────

export interface StartRunResult {
  run: TournamentRun | null;
  entry: EntryType;
}

export function startRun(
  state: CareerState,
  rng: Rng,
  slot: number,
  def: TournamentDef,
  aiEntrants: string[],
): StartRunResult {
  const level = LEVELS[def.level];
  const projection = projectEntry(state, def);
  let entry: EntryType = 'direct';
  let qualifying: TournamentRun['qualifying'] = null;

  if (level.pro) {
    if (projection.status === 'none' || projection.status === 'wildcard' || projection.status === 'qualifier') {
      const wcRoll = projection.wildcard > 0 && rng.chance(projection.wildcard);
      if (wcRoll && def.level !== 'itf15') entry = 'wildcard';
      else if (projection.status === 'qualifier') entry = 'qualifier';
      else if (def.level === 'itf15') entry = 'direct';
      else return { run: null, entry: 'none' };
    } else if (projection.status === 'exempt') {
      entry = 'exempt';
      state.pro.exemptions -= 1;
    }
  }

  // Main-draw entrants: AI sorted best-first, then the player in place of the weakest.
  const ai = aiById(state);
  let entrants = [...aiEntrants];
  const size = def.level === 'finals' ? 8 : level.drawSize;
  if (entry === 'qualifier') {
    const inDraw = new Set(entrants);
    const pool = state.field
      .filter((a) => !inDraw.has(a.id) && !state.season.busy.includes(a.id))
      .sort((a, b) => b.rating - a.rating);
    const band = pool.slice(Math.floor(pool.length * 0.05), Math.floor(pool.length * 0.45));
    const opponents: string[] = [];
    const choices = band.length >= level.qualRounds ? band : pool;
    const picked = new Set<string>();
    while (opponents.length < level.qualRounds && picked.size < choices.length) {
      const c = rng.pick(choices);
      if (picked.has(c.id)) continue;
      picked.add(c.id);
      opponents.push(c.id);
    }
    opponents.sort((a, b) => (ai.get(a)?.rating ?? 0) - (ai.get(b)?.rating ?? 0));
    qualifying = { opponents, index: 0 };
  } else {
    if (entrants.length >= size) entrants = entrants.slice(0, size - 1);
    entrants.push(PLAYER_ID);
    entrants = sortEntrants(state, entrants);
  }

  const run: TournamentRun = {
    tournamentId: def.id,
    slot,
    entry,
    qualifying,
    draw: [],
    seeds: {},
    roundIndex: 0,
    groups: null,
    matches: [],
    pending: null,
    bronze: false,
    sfLosers: [],
    rrWins: 0,
    done: false,
    reached: null,
    aiReached: {},
    qualPoints: 0,
  };

  if (!qualifying) setupMainDraw(state, rng, run, def, entrants);
  else run.draw = entrants; // provisional: AI main draw, player inserted after qualifying

  const travel = travelCost(state, def);
  addLedger(state, 'travel', l(`Wyjazd: ${def.name.pl}`, `Trip: ${def.name.en}`), -travel);
  return { run, entry };
}

function sortEntrants(state: CareerState, ids: string[]): string[] {
  const ai = aiById(state);
  const isPro = state.season.stage === 'pro';
  const key = (id: string): number => {
    if (id === PLAYER_ID) {
      if (isPro) return state.pro.rank ?? 9999;
      return -(state.season.standings[PLAYER_ID] ?? 0) * 1000;
    }
    const a = ai.get(id);
    if (!a) return 99_999;
    if (isPro) return a.rank ?? 10_000 - a.rating;
    return -(state.season.standings[id] ?? 0) * 1000 - a.rating;
  };
  return [...ids].sort((a, b) => key(a) - key(b));
}

function setupMainDraw(state: CareerState, rng: Rng, run: TournamentRun, def: TournamentDef, entrants: string[]): void {
  if (def.level === 'finals') {
    const field = entrants.slice(0, 8);
    const a = [field[0], field[3], field[4], field[7]].filter(Boolean) as string[];
    const b = [field[1], field[2], field[5], field[6]].filter(Boolean) as string[];
    const wins: Record<string, number> = {};
    for (const id of field) wins[id] = 0;
    run.groups = { a, b, wins };
    run.draw = [];
    run.seeds = Object.fromEntries(field.map((id, i) => [id, i + 1]));
    return;
  }
  const built = buildDraw(rng, entrants, LEVELS[def.level].drawSize);
  run.draw = built.draw;
  run.seeds = built.seeds;
}

function isKeyMatch(ctx: Ctx, roundsLeft: number, opp: AIPlayer | undefined): { key: boolean; max: number } {
  const big = ['gs', 'm1000', 'finals', 'olympics', 'j_slam', 'te_super', 'te_euro', 'j_mini_pl', 'j_nat_pl', 'j_ob', 'j500'].includes(ctx.def.level);
  if (opp?.nemesis) return { key: true, max: 2 };
  if (roundsLeft <= 1) return { key: true, max: 2 };
  if (roundsLeft <= 2) return { key: true, max: big ? 2 : 1 };
  if (big && roundsLeft <= 4) return { key: true, max: 1 };
  return { key: ctx.rng.chance(0.18), max: 1 };
}

function injuryRisk(state: CareerState): number {
  const p = state.player;
  let risk = 0.0035 + (p.fatigue / 100) ** 2 * 0.045;
  if (state.team.physio) risk *= 1 - PHYSIO.injuryReduction;
  if (p.age > 30) risk *= 1.3;
  if (state.season.stage !== 'pro') risk *= 0.4;
  return risk * DIFFICULTIES[state.config.difficulty].injuryFactor;
}

const INJURIES: InjuryKind[] = ['wrist', 'ankle', 'back', 'shoulder', 'abdominal', 'knee', 'elbow'];

type MatchOutcome = 'won' | 'lost' | 'paused';

/** Play (or resume) the player's match against `oppId`. */
function playPlayerMatch(ctx: Ctx, run: TournamentRun, oppId: string, round: string, roundsLeft: number): MatchOutcome {
  const { state, rng } = ctx;
  const opp = ctx.ai.get(oppId);
  if (!opp) throw new Error(`Unknown opponent ${oppId}`);

  let progress = run.pending;
  let injuredNow = false;
  if (!progress) {
    const key = round.startsWith('Q') ? { key: !!opp.nemesis, max: 1 } : isKeyMatch(ctx, roundsLeft, opp);
    progress = {
      oppId,
      round,
      bestOf: ctx.bestOf,
      sets: [],
      nextServer: rng.chance(0.5) ? 'A' : 'B',
      momentum: 0,
      decisions: [],
      decisionsTaken: 0,
      asked: [],
      maxDecisions: key.max,
      key: key.key,
      dayA: dayForm(rng),
      dayB: dayForm(rng),
    };
    injuredNow = rng.chance(injuryRisk(state));
  }

  const p = state.player;
  const group = surfaceGroup(ctx.def.surface);
  const fatiguePenalty = (p.fatigue / 100) * 0.03;
  const setup: MatchSetup = {
    a: playerCompetitor(
      p.skills,
      p.surfaces[group],
      p.hand === 'L',
      FORM_BONUS[state.season.form] + progress.dayA + progress.momentum - fatiguePenalty,
    ),
    b: aiComp(ctx, oppId, progress.dayB),
    surface: ctx.def.surface,
    bestOf: progress.bestOf,
    decidingTiebreak10: ctx.def.level === 'gs',
  };

  if (injuredNow) {
    const first = continueMatch(rng, setup, [], progress.nextServer, true, 1);
    const kind = rng.pick(INJURIES);
    const weeks = rng.weighted([1, 2, 3, 4, 6, 8, 12], (w) => 13 - w);
    const serious = weeks >= 6;
    p.injury = { weeks, kind, serious };
    if (serious) {
      state.stats.seriousInjuries += 1;
      p.skills.fitness = Math.max(1, Math.round((p.skills.fitness - 1.5) * 10) / 10);
    }
    const score: MatchScore = { sets: first.sets, retired: 'A' };
    recordMatch(ctx, run, progress, opp, false, score);
    return 'lost';
  }

  const need = progress.bestOf === 5 ? 3 : 2;
  for (;;) {
    const winner = matchWinner(progress.sets, progress.bestOf);
    if (winner) {
      const score: MatchScore = { sets: progress.sets, retired: null };
      recordMatch(ctx, run, progress, opp, winner === 'A', score);
      return winner === 'A' ? 'won' : 'lost';
    }
    const won = setsWon(progress.sets);
    const afterFirst = progress.sets.length === 1;
    const beforeDeciding = won.a === need - 1 && won.b === need - 1;
    const canAsk =
      progress.key &&
      progress.decisionsTaken < progress.maxDecisions &&
      !progress.asked.includes(progress.sets.length) &&
      (afterFirst || beforeDeciding);
    if (canAsk) {
      progress.asked.push(progress.sets.length);
      run.pending = progress;
      const decision = buildDecision(state, rng, progress, opp, ctx.def.surface, scoreText({ sets: progress.sets, retired: null }));
      state.phase = { kind: 'decision', decision };
      return 'paused';
    }
    const next = continueMatch(rng, setup, progress.sets, progress.nextServer, true, progress.sets.length + 1);
    progress.sets = next.sets;
    progress.nextServer = next.nextServer;
  }
}

function recordMatch(ctx: Ctx, run: TournamentRun, progress: MatchProgress, opp: AIPlayer, won: boolean, score: MatchScore): void {
  const { state } = ctx;
  const stats = state.stats;
  const isPro = ctx.level.pro;
  run.pending = null;
  const match: PlayedMatch = {
    round: progress.round,
    oppId: opp.id,
    oppName: displayName(opp),
    oppNat: opp.nat,
    oppRank: isPro ? opp.rank : null,
    oppSeed: run.seeds[opp.id] ?? null,
    won,
    score,
    scoreText: scoreText(score),
    decisions: progress.decisions,
    nemesis: !!opp.nemesis,
  };
  run.matches.push(match);

  if (won) stats.matchesWon += 1;
  else stats.matchesLost += 1;
  if (isPro) {
    if (won) stats.proMatchesWon += 1;
    else stats.proMatchesLost += 1;
    if (won && (state.pro.rank === null || state.pro.rank > 100) && (opp.rank ?? 999) <= 10) stats.bigUpsets += 1;
  }
  if (opp.nemesis) {
    if (won) stats.nemesisWon += 1;
    else stats.nemesisLost += 1;
  }
  if (won && score.sets.length === 5) stats.fiveSetWins += 1;
  if (won && score.sets.length >= 2 && score.sets.every((s) => s.a === 6 && s.b === 0)) stats.doubleBagels += 1;

  const p = state.player;
  const sets = score.sets.length;
  p.fatigue = Math.min(100, p.fatigue + sets * Math.max(0.8, 3.2 - p.skills.fitness / 50));
  surfaceExperience(state, surfaceGroup(ctx.def.surface), 1);
}

/** Apply a resolved decision's momentum to the paused match. */
export function applyDecisionToRun(run: TournamentRun, situationId: string, option: number, outcome: PlayedMatch['decisions'][number]['outcome'], momentum: number): void {
  if (!run.pending) return;
  run.pending.momentum += momentum;
  run.pending.decisionsTaken += 1;
  run.pending.decisions.push({ situationId, option, outcome });
}

/** Advance the player's run until it pauses for a decision or finishes. */
export function advanceRun(state: CareerState, rng: Rng): 'paused' | 'done' {
  const run = state.season.run;
  if (!run) return 'done';
  const def = tournament(run.tournamentId);
  const ctx = makeCtx(state, rng, def);

  // Qualifying
  if (run.qualifying) {
    const q = run.qualifying;
    while (q.index < q.opponents.length) {
      const opp = q.opponents[q.index] as string;
      const outcome = playPlayerMatch(ctx, run, opp, `Q${q.index + 1}`, 99);
      if (outcome === 'paused') return 'paused';
      if (outcome === 'lost') {
        // Main draw still happens without the player.
        const result = simulateAITournament(state, rng, def, run.draw.filter((x): x is string => !!x));
        run.aiReached = result.reached;
        awardAI(state, def, result.reached, result.rrWins);
        run.done = true;
        run.reached = null;
        run.qualifying = null;
        run.draw = result.champion ? [result.champion] : [];
        return 'done';
      }
      q.index += 1;
    }
    // Qualified: insert the player into the main draw.
    run.qualPoints = LEVELS[def.level].qualPoints;
    const size = LEVELS[def.level].drawSize;
    let entrants = run.draw.filter((x): x is string => !!x);
    if (entrants.length >= size) entrants = entrants.slice(0, size - 1);
    entrants.push(PLAYER_ID);
    entrants = sortEntrants(state, entrants);
    run.qualifying = null;
    setupMainDraw(state, rng, run, def, entrants);
  }

  // Season finals: round robin first.
  if (run.groups && run.roundIndex < 3) {
    if (advanceRoundRobin(ctx, run) === 'paused') return 'paused';
  }

  return advanceKnockout(ctx, run);
}

function advanceRoundRobin(ctx: Ctx, run: TournamentRun): 'paused' | 'continue' {
  const groups = run.groups as NonNullable<TournamentRun['groups']>;
  while (run.roundIndex < 3) {
    const pairs = RR_PAIRINGS[run.roundIndex] as [number, number][];
    for (const group of [groups.a, groups.b]) {
      for (const [i, j] of pairs) {
        const x = group[i];
        const y = group[j];
        if (!x || !y) continue;
        if (x === PLAYER_ID || y === PLAYER_ID) {
          const opp = x === PLAYER_ID ? y : x;
          if (run.matches.some((m) => m.round === `RR${run.roundIndex + 1}`) && !run.pending) continue;
          const outcome = playPlayerMatch(ctx, run, opp, `RR${run.roundIndex + 1}`, 3);
          if (outcome === 'paused') return 'paused';
          const w = outcome === 'won' ? PLAYER_ID : opp;
          groups.wins[w] = (groups.wins[w] ?? 0) + 1;
          if (w === PLAYER_ID) run.rrWins += 1;
        }
      }
    }
    // AI-vs-AI round-robin matches of this round.
    for (const group of [groups.a, groups.b]) {
      for (const [i, j] of pairs) {
        const x = group[i];
        const y = group[j];
        if (!x || !y || x === PLAYER_ID || y === PLAYER_ID) continue;
        const w = quickAI(ctx, x, y);
        groups.wins[w] = (groups.wins[w] ?? 0) + 1;
      }
    }
    run.roundIndex += 1;
  }
  // Group standings → semi-finals A1–B2, B1–A2.
  const order = (group: string[]) =>
    [...group].sort((x, y) => (groups.wins[y] ?? 0) - (groups.wins[x] ?? 0) || strength(ctx, y) - strength(ctx, x));
  const a = order(groups.a);
  const b = order(groups.b);
  for (const id of [...a.slice(2), ...b.slice(2)]) {
    if (id === PLAYER_ID) run.reached = 3;
    else run.aiReached[id] = 3;
  }
  // Semi-finals A1–B2 and B1–A2; an eliminated player simply isn't in the bracket.
  run.draw = [a[0] ?? null, b[1] ?? null, b[0] ?? null, a[1] ?? null];
  run.roundIndex = 3;
  return 'continue';
}

function advanceKnockout(ctx: Ctx, run: TournamentRun): 'paused' | 'done' {
  const { def } = ctx;
  while (run.draw.length > 1) {
    const roundsLeft = Math.log2(run.draw.length);
    const label = roundLabel(roundsLeft);
    // 1) the player's match
    const pos = run.draw.indexOf(PLAYER_ID);
    if (pos >= 0) {
      const oppPos = pos % 2 === 0 ? pos + 1 : pos - 1;
      const opp = run.draw[oppPos] ?? null;
      if (opp) {
        const already = run.matches.some((m) => m.round === label) && !run.pending;
        if (!already) {
          const outcome = playPlayerMatch(ctx, run, opp, label, roundsLeft);
          if (outcome === 'paused') return 'paused';
          if (outcome === 'lost') {
            run.reached = roundsLeft;
            if (roundsLeft === 2) run.sfLosers.push(PLAYER_ID);
            run.draw[pos] = null;
          } else {
            run.draw[oppPos] = null;
            run.aiReached[opp] = roundsLeft;
            if (roundsLeft === 2) run.sfLosers.push(opp);
          }
        }
      }
    }
    // 2) everything else in this round
    const next: (string | null)[] = [];
    for (let i = 0; i < run.draw.length; i += 2) {
      const a = run.draw[i] ?? null;
      const b = run.draw[i + 1] ?? null;
      if (a && b) {
        const w = quickAI(ctx, a, b);
        const loser = w === a ? b : a;
        run.aiReached[loser] = roundsLeft;
        if (roundsLeft === 2) run.sfLosers.push(loser);
        next.push(w);
      } else {
        next.push(a ?? b);
      }
    }
    // A player who lost this round was removed from the bracket above; if both slots of a
    // pair were the player and a bye, `a ?? b` already carries the right participant.
    run.draw = next;
    run.roundIndex += 1;

    // Olympic bronze medal match after the semi-finals.
    if (def.level === 'olympics' && run.draw.length === 2 && run.sfLosers.includes(PLAYER_ID) && !run.bronze) {
      run.bronze = true;
    }
    if (run.bronze && run.reached === 2 && !run.matches.some((m) => m.round === 'BRONZE' && !run.pending)) {
      const opp = run.sfLosers.find((id) => id !== PLAYER_ID);
      if (opp) {
        const outcome = playPlayerMatch(ctx, run, opp, 'BRONZE', 1);
        if (outcome === 'paused') return 'paused';
        if (outcome === 'won') run.reached = 2; // bronze medal, marked in finalize
        run.matches[run.matches.length - 1]!.round = 'BRONZE';
      }
    }
  }
  const champion = run.draw[0] ?? null;
  if (champion === PLAYER_ID) run.reached = 0;
  else if (champion) run.aiReached[champion] = 0;
  run.done = true;
  return 'done';
}

/** Close the run: points, prize, stats, AI awards. */
export function finalizeRun(state: CareerState, _rng: Rng): TournamentResult {
  const run = state.season.run as TournamentRun;
  const def = tournament(run.tournamentId);
  const level = LEVELS[def.level];
  const ai = aiById(state);

  const rrWinsAI: Record<string, number> = run.groups ? { ...run.groups.wins } : {};
  awardAI(state, def, run.aiReached, rrWinsAI);

  const reached = run.reached;
  let points = 0;
  let prize = 0;
  let medal: TournamentResult['medal'] = null;
  if (def.level === 'finals') {
    points = run.rrWins * 200 + (reached !== null && reached <= 1 ? 400 : 0) + (reached === 0 ? 500 : 0);
    prize = 1_200_000 + run.rrWins * 1_400_000 + (reached !== null && reached <= 1 ? 2_800_000 : 0) + (reached === 0 ? 4_600_000 : 0);
  } else if (def.level === 'olympics') {
    if (reached === 0) medal = 'gold';
    else if (reached === 1) medal = 'silver';
    else if (reached === 2 && run.matches.some((m) => m.round === 'BRONZE' && m.won)) medal = 'bronze';
  } else {
    points = pointsFor(level, reached) + run.qualPoints;
    prize = prizeFor(level, reached);
  }
  prize = Math.round(prize * prizeShare(state));

  if (level.pro) {
    if (points > 0) state.pro.results.push([globalWeek(state.season.year, def.week), points]);
  } else {
    state.season.standings[PLAYER_ID] = (state.season.standings[PLAYER_ID] ?? 0) + points;
  }
  if (prize > 0) {
    addLedger(state, 'prize', l(`Premia: ${def.name.pl}`, `Prize: ${def.name.en}`), prize);
    state.stats.prizeMoney += prize;
  }

  applyResultStats(state, def, run, reached, medal);

  const championId = reached === 0 ? PLAYER_ID : (Object.entries(run.aiReached).find(([, r]) => r === 0)?.[0] ?? null);
  const champion = championId && championId !== PLAYER_ID ? ai.get(championId) : null;
  const label =
    reached === null
      ? `Q${run.matches.length}`
      : def.level === 'finals' && reached === 3
        ? 'RR'
        : medal === 'bronze'
          ? 'BRONZE'
          : roundLabel(reached);

  const result: TournamentResult = {
    tournamentId: def.id,
    year: state.season.year,
    level: def.level,
    surface: def.surface,
    slam: def.slam ?? null,
    entry: run.entry,
    reached,
    label,
    points,
    prize,
    travel: travelCost(state, def),
    matches: run.matches,
    championId,
    championName: championId === PLAYER_ID ? `${state.player.first} ${state.player.last}` : champion ? displayName(champion) : null,
    rankAfter: null,
    medal,
  };
  state.season.run = null;
  return result;
}

function applyResultStats(
  state: CareerState,
  def: TournamentDef,
  run: TournamentRun,
  reached: number | null,
  medal: TournamentResult['medal'],
): void {
  const stats = state.stats;
  const level = LEVELS[def.level];
  const p = state.player;
  const prestige = level.prestige;
  if (medal) stats.olympic[medal] += 1;
  if (reached === null) return;

  if (def.slam && def.level === 'gs') {
    const best = stats.slamBest[def.slam];
    stats.slamBest[def.slam] = best === null ? reached : Math.min(best, reached);
    if (reached <= 1) stats.slamFinals += 1;
    if (reached <= 2) stats.slamSemis += 1;
    if (reached <= 3) stats.slamQuarters += 1;
  }
  if (reached <= 1) stats.finals += 1;
  if (reached === 0) {
    stats.titles.push({ year: state.season.year, tournamentId: def.id, level: def.level, surface: def.surface, slam: def.slam ?? null });
    stats.proTitlesByLevel[def.level] = (stats.proTitlesByLevel[def.level] ?? 0) + 1;
    if (def.level === 'gs' && def.slam) stats.slamTitles[def.slam] += 1;
    if (def.level === 'j_slam') stats.juniorSlamTitles += 1;
    if (def.level === 'j_mini_pl' || def.level === 'j_nat_pl') stats.polishChampionships += 1;
    if (run.entry === 'qualifier') stats.qualifierTitles += 1;
    if (run.entry === 'wildcard') stats.wildcardTitles += 1;
    p.reputation = Math.min(100, p.reputation + prestige / 22 + 1);
    p.media = Math.min(100, p.media + prestige / 18 + 1);
    p.morale = Math.min(100, p.morale + 8);
  } else if (reached <= 2) {
    p.reputation = Math.min(100, p.reputation + prestige / 60);
    p.media = Math.min(100, p.media + prestige / 50);
    p.morale = Math.min(100, p.morale + 3);
  } else if (reached >= 5 && level.pro) {
    p.morale = Math.max(0, p.morale - 2);
  }
}

export function notEnteredResult(state: CareerState, def: TournamentDef, label: 'DNE' | 'INJ'): TournamentResult {
  return {
    tournamentId: def.id,
    year: state.season.year,
    level: def.level,
    surface: def.surface,
    slam: def.slam ?? null,
    entry: 'none',
    reached: null,
    label,
    points: 0,
    prize: 0,
    travel: 0,
    matches: [],
    championId: null,
    championName: null,
    rankAfter: null,
    medal: null,
  };
}
