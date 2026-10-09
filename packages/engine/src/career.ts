import { BACKGROUNDS } from './content/backgrounds';
import { COACHES } from './content/coaches';
import { EVENTS_BY_ID } from './content/events';
import { polishName } from './content/names';
import {
  DEBT_LIMIT_JUNIOR,
  DEBT_LIMIT_PRO,
  MAX_AGE,
  MIN_RETIRE_AGE,
  START_AGE,
  START_YEAR,
} from './model/constants';
import { SKILL_IDS } from './model/skills';
import type {
  Action,
  CareerConfig,
  CareerState,
  Gender,
  RetireReason,
  Skills,
} from './model/types';
import { Rng, hashSeed } from './rng';
import { resolveDecision } from './sim/decisions';
import { acceptSponsors, generateSponsorOffers } from './sim/economy';
import { buildJuniorField } from './sim/field';
import { computeLegacy } from './sim/legacy';
import { applyTraining } from './sim/development';
import {
  buildPendingEvent,
  isOptionAvailable,
  pickOffseasonEvents,
  resolveEvent,
} from './sim/story';
import {
  autoPlan,
  endSeason,
  newSeasonState,
  playNext,
  startSeason,
  turnPro,
  validatePlan,
} from './sim/season';
import { applyDecisionToRun } from './sim/tournament';
import { ENGINE_VERSION } from './version';

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/** Suggest a random Polish name (UI "Wylosuj" button). Not part of the seeded simulation. */
export function suggestName(seed: string, gender: Gender): { first: string; last: string } {
  const n = polishName(new Rng(hashSeed(seed)), gender);
  return { first: n.first, last: n.last };
}

// ─── Creation ────────────────────────────────────────────────────────────────

export function createCareer(config: CareerConfig, seed: string): CareerState {
  const rng = Rng.fromSeed(seed);
  const bg = BACKGROUNDS[config.background];
  const gender = config.gender;

  const avgHeight = gender === 'M' ? 185 : 172;
  const heightCm = Math.round(
    Math.max(avgHeight - 18, Math.min(avgHeight + 20, rng.normal(avgHeight, 7))),
  );
  const overallPotential = rng.range(bg.potential[0], bg.potential[1]);
  const heightDelta = heightCm - avgHeight;

  const potential = {} as Skills;
  const skills = {} as Skills;
  for (const id of SKILL_IDS) {
    let pot = overallPotential + rng.normal(0, 4.5);
    if (id === 'serve') pot += heightDelta * 0.4;
    if (id === 'fitness' || id === 'backhand') pot -= heightDelta * 0.15;
    potential[id] = Math.round(Math.max(40, Math.min(99, pot)) * 10) / 10;
    const start = potential[id] * 0.22 + rng.normal(4, 2.5) + bg.skillBonus;
    skills[id] = Math.round(Math.max(5, Math.min(45, start)) * 10) / 10;
  }

  const familyTier = rng.weighted([0, 1, 2] as const, (t) => {
    const table = {
      wall: [0.5, 0.4, 0.1],
      sponsor_kid: [0, 0, 1],
      academy: [0.3, 0.5, 0.2],
      chosen: [0.2, 0.5, 0.3],
    }[config.background];
    return table[t] as number;
  });

  const state: CareerState = {
    engineVersion: ENGINE_VERSION,
    seed,
    rng: [0, 0, 0, 0],
    config,
    player: {
      first: config.name.first.trim() || 'Jan',
      last: config.name.last.trim() || 'Kowalski',
      gender,
      nat: 'PL',
      birthYear: START_YEAR - START_AGE,
      age: START_AGE,
      hand: rng.chance(0.12) ? 'L' : 'R',
      heightCm,
      heightRevealed: false,
      skills,
      potential,
      surfaces: { clay: 40, hard: 36, grass: 12 },
      morale: 60,
      media: bg.media,
      reputation: 5,
      fatigue: 0,
      injury: null,
      streakWeeks: 0,
    },
    team: { coach: bg.coach, physio: false, fitnessCoach: false, coachSeasons: 0 },
    finance: { budget: bg.budget, familyTier, familySupport: 0, familyRevealed: false, ledger: [] },
    sponsors: [],
    phase: { kind: 'training', chosen: null },
    eventQueue: [],
    season: undefined as unknown as CareerState['season'],
    field: [],
    pro: { points: 0, rank: null, results: [], exemptions: 0, turnedProAge: null },
    stats: {
      titles: [],
      finals: 0,
      proTitlesByLevel: {},
      slamBest: { ao: null, rg: null, wim: null, uso: null },
      slamTitles: { ao: 0, rg: 0, wim: 0, uso: 0 },
      slamFinals: 0,
      slamSemis: 0,
      slamQuarters: 0,
      juniorSlamTitles: 0,
      juniorYearEndNo1: false,
      polishChampionships: 0,
      olympic: { gold: 0, silver: 0, bronze: 0 },
      davisCup: 0,
      weeksAtNo1: 0,
      yearEndNo1: 0,
      yearEndTop10: 0,
      peakRank: null,
      peakRankYear: null,
      matchesWon: 0,
      matchesLost: 0,
      proMatchesWon: 0,
      proMatchesLost: 0,
      prizeMoney: 0,
      sponsorMoney: 0,
      seriousInjuries: 0,
      nemesisWon: 0,
      nemesisLost: 0,
      decisionsSuper: 0,
      bigUpsets: 0,
      maxDebt: 0,
      fiveSetWins: 0,
      doubleBagels: 0,
      qualifierTitles: 0,
      wildcardTitles: 0,
    },
    history: [],
    flags: [],
    seenEvents: [],
    legacy: 0,
    nextId: 0,
    actionCount: 0,
  };
  state.finance.familySupport = 0;
  state.season = newSeasonState(state, 'mini', START_YEAR);
  state.field = buildJuniorField(state, rng, 'mini');
  state.rng = rng.state;
  return state;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/** Pure step: returns a new state, never mutates the input. */
export function step(state: CareerState, action: Action): CareerState {
  const draft = structuredClone(state);
  applyAction(draft, action);
  return draft;
}

/** Mutating step used by replay (one clone for the whole log). */
export function applyAction(state: CareerState, action: Action): void {
  const rng = new Rng(state.rng);
  try {
    dispatch(state, rng, action);
  } finally {
    state.rng = rng.state;
  }
  state.actionCount += 1;
}

export function replay(config: CareerConfig, seed: string, actions: Action[]): CareerState {
  const state = createCareer(config, seed);
  for (const action of actions) applyAction(state, action);
  return state;
}

function dispatch(state: CareerState, rng: Rng, action: Action): void {
  const phase = state.phase;
  switch (phase.kind) {
    case 'event': {
      const event = phase.event;
      if (action.t === 'choose' && !event.resolved) {
        if (!isOptionAvailable(state, event.eventId, action.option))
          throw new EngineError('Option unavailable');
        resolveEvent(state, rng, event, action.option);
        return;
      }
      if (action.t === 'continue' && event.resolved) {
        if (state.flags.includes('turn_pro_now')) {
          state.flags = state.flags.filter((f) => f !== 'turn_pro_now');
          turnPro(state, rng, state.season.year);
        }
        if (event.context === 'midseason') {
          state.phase = { kind: 'season' };
          return;
        }
        nextOffseasonStep(state, rng);
        return;
      }
      break;
    }
    case 'training': {
      if (action.t === 'train' && SKILL_IDS.includes(action.skill)) {
        applyTraining(state, action.skill);
        state.phase = { kind: 'team' };
        return;
      }
      break;
    }
    case 'team': {
      if (action.t === 'team') {
        const coach = COACHES[action.coach];
        if (!coach) throw new EngineError('Unknown coach');
        if (action.coach !== state.team.coach && state.player.reputation < coach.minReputation) {
          throw new EngineError('Reputation too low for this coach');
        }
        if (action.coach !== state.team.coach) {
          state.team.coach = action.coach;
          state.team.coachSeasons = 0;
        }
        state.team.physio = action.physio;
        state.team.fitnessCoach = action.fitnessCoach;
        state.phase = { kind: 'sponsors', offers: generateSponsorOffers(state, rng) };
        return;
      }
      break;
    }
    case 'sponsors': {
      if (action.t === 'sponsors') {
        acceptSponsors(state, phase.offers, action.accept);
        state.season.plan = autoPlan(state);
        state.phase = { kind: 'schedule' };
        return;
      }
      break;
    }
    case 'schedule': {
      if (action.t === 'schedule') {
        state.season.plan = validatePlan(state, action.plan);
        startSeason(state, rng);
        state.phase = { kind: 'season' };
        return;
      }
      break;
    }
    case 'season': {
      if (action.t === 'play') {
        const status = playNext(state, rng);
        if (status === 'season_over') {
          const record = endSeason(state, rng);
          state.phase = { kind: 'season_end', record };
        }
        return;
      }
      break;
    }
    case 'decision': {
      const decision = phase.decision;
      if (action.t === 'choose' && !decision.resolved) {
        if (!decision.options[action.option]) throw new EngineError('Invalid option');
        resolveDecision(state, rng, decision, action.option);
        return;
      }
      if (action.t === 'continue' && decision.resolved) {
        const run = state.season.run;
        if (run) {
          applyDecisionToRun(
            run,
            decision.situationId,
            decision.resolved.option,
            decision.resolved.outcome,
            decision.resolved.momentum,
          );
        }
        state.phase = { kind: 'season' };
        const status = playNext(state, rng);
        if (status === 'season_over') {
          const record = endSeason(state, rng);
          state.phase = { kind: 'season_end', record };
        }
        return;
      }
      break;
    }
    case 'season_end': {
      if (action.t === 'retire') {
        if (phase.record.age < MIN_RETIRE_AGE) throw new EngineError('Too young to retire');
        retire(state, 'choice');
        return;
      }
      if (action.t === 'continue') {
        const reason = forcedRetirement(state, rng);
        if (reason) {
          retire(state, reason);
          return;
        }
        beginOffseason(state, rng);
        return;
      }
      break;
    }
    case 'retired':
      break;
  }
  throw new EngineError(`Action "${action.t}" not allowed in phase "${phase.kind}"`);
}

function forcedRetirement(state: CareerState, rng: Rng): RetireReason | null {
  const p = state.player;
  if (p.age > MAX_AGE) return 'age';
  if (state.flags.includes('retire_forced')) return 'injury';
  const limit = state.season.stage === 'pro' ? DEBT_LIMIT_PRO : DEBT_LIMIT_JUNIOR;
  if (state.finance.budget < limit) {
    if (state.flags.includes('debt_warned')) return 'debt';
    state.flags.push('debt_warned');
  } else if (state.finance.budget >= 0) {
    state.flags = state.flags.filter((f) => f !== 'debt_warned');
  }
  const lastSeason = state.history[state.history.length - 1];
  if (p.age >= 32 && lastSeason && p.injury?.serious && rng.chance(0.25)) return 'injury';
  return null;
}

function retire(state: CareerState, reason: RetireReason): void {
  state.legacy = computeLegacy(state);
  state.phase = { kind: 'retired', reason };
}

function beginOffseason(state: CareerState, rng: Rng): void {
  state.eventQueue = pickOffseasonEvents(state, rng);
  nextOffseasonStep(state, rng);
}

function nextOffseasonStep(state: CareerState, _rng: Rng): void {
  const next = state.eventQueue.shift();
  if (next && EVENTS_BY_ID[next]) {
    state.phase = { kind: 'event', event: buildPendingEvent(state, next, 'offseason') };
    return;
  }
  state.phase = { kind: 'training', chosen: null };
}

// ─── Helpers for clients ─────────────────────────────────────────────────────

export function isFinished(state: CareerState): boolean {
  return state.phase.kind === 'retired';
}

export function canRetire(state: CareerState): boolean {
  return state.phase.kind === 'season_end' && state.phase.record.age >= MIN_RETIRE_AGE;
}
