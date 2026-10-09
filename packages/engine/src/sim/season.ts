import { LEVELS } from '../content/levels';
import type { HEADLINES } from '../content/headlines';
import { STAGES, stageForAge } from '../content/stages';
import { juniorCalendar, lowerTierForWeek, tourEvents, tournament } from '../content/tournaments';
import { PHYSIO } from '../content/coaches';
import { FORM_WEIGHTS } from '../model/constants';
import { overall } from '../model/skills';
import type {
  CareerState,
  FormId,
  HeadlineView,
  SeasonRecord,
  SeasonSlot,
  SeasonState,
  StageId,
  TournamentDef,
  TournamentResult,
} from '../model/types';
import type { Rng } from '../rng';
import { developPlayer } from './development';
import { applySeasonStartFinances, settleSponsors, travelCost } from './economy';
import { buildJuniorField, buildProPool, developAI, evolveProPool, globalWeek, updateRankings } from './field';
import { computeLegacy } from './legacy';
import { maybeMidseasonEvent, buildPendingEvent } from './story';
import {
  PLAYER_ID,
  advanceRun,
  assignWeek,
  awardAI,
  finalizeRun,
  juniorEntrants,
  notEnteredResult,
  projectEntry,
  simulateAITournament,
  simulateVirtualEvents,
  startRun,
} from './tournament';

// ─── Calendar ────────────────────────────────────────────────────────────────

export function buildSlots(state: CareerState, stage: StageId, year: number): SeasonSlot[] {
  if (stage !== 'pro') {
    return juniorCalendar(stage).map((t) => ({ week: t.week, span: 1, options: [t.id] }));
  }
  const tour = tourEvents(state.config.gender, year);
  const slots: SeasonSlot[] = [];
  for (let week = 1; week <= 47; week++) {
    const options = [
      ...tour.filter((t) => t.week === week).map((t) => t.id),
      ...lowerTierForWeek(week).map((t) => t.id),
    ];
    if (options.length > 0) slots.push({ week, span: 1, options });
  }
  return slots;
}

export function newSeasonState(state: CareerState, stage: StageId, year: number): SeasonState {
  const slots = buildSlots(state, stage, year);
  return {
    year,
    stage,
    form: 'normal',
    slots,
    plan: slots.map(() => null),
    cursor: 0,
    results: [],
    standings: {},
    run: null,
    midEventsLeft: 2,
    budgetStart: state.finance.budget,
    started: false,
    busy: [],
  };
}

/** Removes invalid picks and overlaps with two-week events. */
export function validatePlan(state: CareerState, plan: (string | null)[]): (string | null)[] {
  const slots = state.season.slots;
  const out: (string | null)[] = slots.map((slot, i) => {
    const pick = plan[i] ?? null;
    return pick && slot.options.includes(pick) ? pick : null;
  });
  for (let i = 0; i < out.length; i++) {
    const pick = out[i];
    if (!pick) continue;
    const def = tournament(pick);
    const nextSlot = slots[i + 1];
    if (def.span > 1 && nextSlot && nextSlot.week < def.week + def.span) out[i + 1] = null;
  }
  return out;
}

/** A sensible default schedule for the player's current ranking and budget. */
export function autoPlan(state: CareerState): (string | null)[] {
  const slots = state.season.slots;
  if (state.season.stage !== 'pro') {
    let budget = state.finance.budget;
    return slots.map((slot) => {
      const id = slot.options[0] as string;
      const cost = travelCost(state, tournament(id));
      if (budget - cost < -5000 && LEVELS[tournament(id).level].prestige < 300) return null;
      budget -= cost;
      return id;
    });
  }
  const plan: (string | null)[] = [];
  let streak = 0;
  let planned = 0;
  let budget = state.finance.budget;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i] as SeasonSlot;
    const prev = plan[i - 1] ? tournament(plan[i - 1] as string) : null;
    if (prev && prev.span > 1 && slot.week < prev.week + prev.span) {
      plan.push(null);
      continue;
    }
    let best: { id: string; score: number } | null = null;
    for (const id of slot.options) {
      const def = tournament(id);
      const level = LEVELS[def.level];
      const entry = projectEntry(state, def);
      let score = 0;
      if (entry.status === 'direct' || entry.status === 'exempt') score = level.prestige;
      else if (entry.status === 'qualifier') score = level.prestige * 0.45;
      else if (entry.status === 'wildcard') score = level.prestige * entry.wildcard * 0.9;
      if (score <= 0) continue;
      if (budget < 60_000) score -= travelCost(state, def) / 2500;
      if (!best || score > best.score) best = { id, score };
    }
    const major = best ? ['gs', 'm1000', 'finals', 'olympics'].includes(tournament(best.id).level) : false;
    const rest = streak >= 3 && !major;
    if (!best || best.score <= 0 || rest || planned >= 24) {
      plan.push(null);
      streak = 0;
      continue;
    }
    plan.push(best.id);
    budget -= travelCost(state, tournament(best.id));
    planned += 1;
    streak += 1;
  }
  return validatePlan(state, plan);
}

// ─── Season start ────────────────────────────────────────────────────────────

const FORMS: FormId[] = ['crisis', 'weak', 'normal', 'good', 'great', 'life'];

export function rollForm(state: CareerState, rng: Rng): FormId {
  const p = state.player;
  const shift = (p.morale - 50) / 50 + (p.skills.mental - 50) / 120;
  return rng.weighted(FORMS, (f) => {
    const base = FORM_WEIGHTS[f];
    if (f === 'good' || f === 'great' || f === 'life') return base * Math.max(0.3, 1 + shift * 0.5);
    if (f === 'crisis' || f === 'weak') return base * Math.max(0.3, 1 - shift * 0.5);
    return base;
  });
}

export function startSeason(state: CareerState, rng: Rng): void {
  state.season.form = rollForm(state, rng);
  state.season.budgetStart = state.finance.budget;
  applySeasonStartFinances(state);
  state.season.started = true;
  if (state.season.stage === 'pro') updateRankings(state, globalWeek(state.season.year, 0));
}

// ─── Week loop ───────────────────────────────────────────────────────────────

export type PlayStatus = 'paused' | 'tournament' | 'event' | 'season_over';

/**
 * Process weeks until the player's next tournament is complete, a decision pauses a match,
 * or the season ends. Rest weeks are simulated in passing.
 */
export function playNext(state: CareerState, rng: Rng): PlayStatus {
  const season = state.season;
  for (;;) {
    if (season.run) {
      const status = advanceRun(state, rng);
      if (status === 'paused') return 'paused';
      const result = finalizeRun(state, rng);
      return completeTournament(state, rng, result);
    }
    if (season.cursor >= season.slots.length) return 'season_over';

    const slot = season.slots[season.cursor] as SeasonSlot;
    const planned = season.plan[season.cursor] ?? null;
    const injured = !!state.player.injury;
    const playerEvent = planned && !injured ? planned : null;

    const events = slot.options.map((id) => tournament(id));
    const entrants = simulateWeekForAI(state, rng, events, playerEvent);

    if (planned && injured) {
      season.results.push(notEnteredResult(state, tournament(planned), 'INJ'));
      postWeek(state, false, slot.week);
      season.cursor += 1;
      continue;
    }
    if (!playerEvent) {
      postWeek(state, false, slot.week);
      season.cursor += 1;
      continue;
    }

    const def = tournament(playerEvent);
    const start = startRun(state, rng, season.cursor, def, entrants);
    if (!start.run) {
      // No entry — the event still happens without us.
      const result = simulateAITournament(state, rng, def, entrants);
      awardAI(state, def, result.reached, result.rrWins);
      season.results.push(notEnteredResult(state, def, 'DNE'));
      postWeek(state, false, slot.week);
      season.cursor += 1;
      return 'tournament';
    }
    season.run = start.run;
  }
}

/** Simulate the week's events without the player; returns AI entrants of the player's event. */
function simulateWeekForAI(
  state: CareerState,
  rng: Rng,
  events: TournamentDef[],
  playerEvent: string | null,
): string[] {
  const season = state.season;
  if (season.stage !== 'pro') {
    const def = events[0] as TournamentDef;
    if (playerEvent) return juniorEntrants(state, rng, def, true);
    const field = juniorEntrants(state, rng, def, false);
    const result = simulateAITournament(state, rng, def, field);
    awardAI(state, def, result.reached);
    return [];
  }
  const busy = new Set(season.busy);
  const { byEvent: assignment, leftover } = assignWeek(state, rng, events, busy);
  simulateVirtualEvents(state, rng, leftover, events[0]?.week ?? 1);
  const nextBusy: string[] = [];
  let playerEntrants: string[] = [];
  for (const def of events) {
    const entrants = assignment.get(def.id) ?? [];
    if (def.span > 1) nextBusy.push(...entrants);
    if (def.id === playerEvent) {
      playerEntrants = entrants;
      continue;
    }
    const result = simulateAITournament(state, rng, def, entrants);
    awardAI(state, def, result.reached, result.rrWins);
  }
  season.busy = nextBusy;
  return playerEntrants;
}

function completeTournament(state: CareerState, rng: Rng, result: TournamentResult): PlayStatus {
  const season = state.season;
  const slot = season.slots[season.cursor] as SeasonSlot;
  postWeek(state, true, slot.week);
  result.rankAfter = season.stage === 'pro' ? state.pro.rank : juniorRank(state);
  season.results.push(result);
  season.cursor += 1;

  const eventId = maybeMidseasonEvent(state, rng);
  if (eventId) {
    season.midEventsLeft -= 1;
    state.phase = { kind: 'event', event: buildPendingEvent(state, eventId, 'midseason') };
    return 'event';
  }
  return 'tournament';
}

function postWeek(state: CareerState, played: boolean, week: number): void {
  const p = state.player;
  const isPro = state.season.stage === 'pro';
  const recovery = state.team.physio ? PHYSIO.recovery : 1;
  if (played) {
    p.streakWeeks += 1;
    p.fatigue = Math.max(0, p.fatigue - 4 * recovery);
  } else {
    p.streakWeeks = 0;
    p.fatigue = Math.max(0, p.fatigue - 14 * recovery);
  }
  if (!isPro) p.fatigue = Math.max(0, p.fatigue - 20);
  if (p.streakWeeks >= 4) p.fatigue = Math.min(100, p.fatigue + 4);
  if (p.injury) {
    p.injury.weeks -= 1;
    if (p.injury.weeks <= 0) p.injury = null;
  }
  if (isPro) {
    updateRankings(state, globalWeek(state.season.year, week));
    const rank = state.pro.rank;
    if (rank !== null) {
      if (rank === 1) state.stats.weeksAtNo1 += 1;
      if (state.stats.peakRank === null || rank < state.stats.peakRank) {
        state.stats.peakRank = rank;
        state.stats.peakRankYear = state.season.year;
      }
      if (rank <= 100 && state.team.coach === 'dad' && !state.flags.includes('dad_top100')) {
        state.flags.push('dad_top100');
      }
    }
  }
}

export function juniorStandings(state: CareerState): { id: string; points: number }[] {
  const ids = [...state.field.map((a) => a.id), PLAYER_ID];
  return ids
    .map((id) => ({ id, points: state.season.standings[id] ?? 0 }))
    .sort((a, b) => b.points - a.points);
}

export function juniorRank(state: CareerState): number {
  const table = juniorStandings(state);
  const mine = state.season.standings[PLAYER_ID] ?? 0;
  return table.filter((r) => r.points > mine).length + 1;
}

// ─── Season end ──────────────────────────────────────────────────────────────

export function endSeason(state: CareerState, rng: Rng): SeasonRecord {
  const season = state.season;
  const isPro = season.stage === 'pro';
  const stats = state.stats;
  const rankEnd = isPro ? state.pro.rank : juniorRank(state);

  if (!isPro && season.stage === 'itf_junior' && rankEnd === 1) stats.juniorYearEndNo1 = true;
  if (isPro && rankEnd !== null) {
    if (rankEnd === 1) {
      stats.yearEndNo1 += 1;
      stats.weeksAtNo1 += 5;
    }
    if (rankEnd <= 10) stats.yearEndTop10 += 1;
  }

  const played = season.results.filter((r) => r.matches.length > 0);
  const won = played.reduce((n, r) => n + r.matches.filter((m) => m.won).length, 0);
  const lost = played.reduce((n, r) => n + r.matches.filter((m) => !m.won).length, 0);
  const titles = season.results.filter((r) => r.reached === 0).map((r) => r.tournamentId);
  const best = bestResult(season.results);

  const record: SeasonRecord = {
    year: season.year,
    age: state.player.age,
    stage: season.stage,
    ovr: overall(state.player.skills),
    form: season.form,
    rankEnd,
    points: isPro ? state.pro.points : (season.standings[PLAYER_ID] ?? 0),
    titles,
    best: best ? best.tournamentId : null,
    prize: season.results.reduce((n, r) => n + r.prize, 0),
    budgetEnd: state.finance.budget,
    legacyAfter: 0,
    played: played.length,
    won,
    lost,
    headline: headlineFor(state, season.results, rankEnd),
  };

  settleSponsors(state);
  if (!isPro && !state.field.some((a) => a.nemesis) && season.stage !== 'mini') designateNemesis(state);

  // Development and ageing
  developPlayer(state, rng);
  const p = state.player;
  p.age += 1;
  p.morale = Math.round(p.morale + (55 - p.morale) * 0.25);
  p.media = Math.round(p.media * 0.94 * 10) / 10;
  p.fatigue = 8;
  p.streakWeeks = 0;
  if (p.injury) {
    p.injury.weeks -= 5;
    if (p.injury.weeks <= 0) p.injury = null;
  }
  state.team.coachSeasons += 1;
  const nextYear = season.year + 1;

  // AI fields and stage transitions
  const nextStage: StageId = isPro ? 'pro' : stageForAge(p.age);
  if (isPro) {
    evolveProPool(state, rng, nextYear);
  } else {
    for (const ai of state.field) developAI(ai, rng, nextYear);
  }
  if (season.stage === 'itf_junior' && nextStage === 'pro' && rankEnd !== null && rankEnd <= 10) {
    state.pro.exemptions += 3;
  }

  state.legacy = computeLegacy(state);
  record.legacyAfter = state.legacy;
  state.history.push(record);
  state.finance.ledger = [];

  if (!isPro && nextStage === 'pro') {
    turnPro(state, rng, nextYear);
  } else {
    if (!isPro && nextStage !== season.stage) {
      state.season.year = nextYear;
      state.field = buildJuniorField(state, rng, nextStage);
    }
    state.season = newSeasonState(state, nextStage, nextYear);
    if (nextStage === 'pro') updateRankings(state, globalWeek(nextYear, 0));
  }
  return record;
}

/** Switch to the professional tour (end of juniors or the early "turn pro" decision). */
export function turnPro(state: CareerState, rng: Rng, year: number): void {
  state.pro.turnedProAge = state.player.age;
  state.season.year = year;
  state.season.stage = 'pro';
  state.field = buildProPool(state, rng);
  state.season = newSeasonState(state, 'pro', year);
  updateRankings(state, globalWeek(year, 0));
}

function designateNemesis(state: CareerState): void {
  const beatMe = new Map<string, number>();
  for (const r of state.season.results) {
    for (const m of r.matches) if (!m.won) beatMe.set(m.oppId, (beatMe.get(m.oppId) ?? 0) + 1);
  }
  const candidates = state.field.filter((a) => beatMe.has(a.id));
  const pool = candidates.length > 0 ? candidates : state.field;
  const pick = [...pool].sort((a, b) => (beatMe.get(b.id) ?? 0) - (beatMe.get(a.id) ?? 0) || b.potential - a.potential)[0];
  if (pick) pick.nemesis = true;
}

function bestResult(results: TournamentResult[]): TournamentResult | null {
  let best: TournamentResult | null = null;
  let bestScore = -1;
  for (const r of results) {
    if (r.reached === null) continue;
    const score = LEVELS[r.level].prestige * (8 - Math.min(7, r.reached));
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}

function headlineFor(state: CareerState, results: TournamentResult[], rank: number | null): HeadlineView {
  const name = `${state.player.first} ${state.player.last}`;
  const base = { name, last: state.player.last, rank: rank ?? '—' };
  const titles = results.filter((r) => r.reached === 0);
  const slam = titles.find((r) => r.level === 'gs');
  const event = (r: TournamentResult) => tournament(r.tournamentId).name.pl;
  const injuries = results.filter((r) => r.label === 'INJ').length;
  const pick = (templateId: keyof typeof HEADLINES, vars: Record<string, string | number> = {}): HeadlineView => ({
    templateId,
    vars: { ...base, ...vars },
  });

  if (slam) return pick('slam_title', { event: event(slam), eventId: slam.tournamentId });
  if (state.season.stage === 'pro' && rank === 1) return pick('year_end_no1');
  const finals = titles.find((r) => r.level === 'finals');
  if (finals) return pick('finals_title', { event: event(finals), eventId: finals.tournamentId });
  const big = titles.find((r) => ['m1000', 't500'].includes(r.level));
  if (big) return pick('big_title', { event: event(big), eventId: big.tournamentId });
  const juniorSlam = titles.find((r) => r.level === 'j_slam');
  if (juniorSlam) return pick('junior_slam', { event: event(juniorSlam), eventId: juniorSlam.tournamentId });
  if (state.season.stage === 'itf_junior' && rank === 1) return pick('junior_no1');
  const polish = titles.find((r) => r.level === 'j_mini_pl' || r.level === 'j_nat_pl');
  if (polish) return pick('polish_champ');
  if (state.season.stage === 'pro') {
    if (rank !== null && rank <= 10) return pick('top10');
    if (titles.length >= 2) return pick('titles', { titles: titles.length });
    const firstPro = titles[0];
    if (firstPro && state.stats.titles.filter((t) => LEVELS[t.level].pro).length === titles.length) {
      return pick('pro_title', { event: event(firstPro), eventId: firstPro.tournamentId });
    }
    if (rank !== null && rank <= 100) return pick('top100');
    if (injuries >= 3) return pick('injury');
    if (rank === null || rank > 400) return pick('struggle');
    return pick('quiet');
  }
  if (rank !== null && rank <= 3) return pick('junior_top');
  return pick('quiet');
}

export function stageName(stage: StageId) {
  return STAGES[stage].name;
}
