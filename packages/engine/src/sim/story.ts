import { EVENTS, EVENTS_BY_ID, type StoryEvent, type StoryOption } from '../content/events';
import { overall } from '../model/skills';
import type { CareerState, PendingEvent } from '../model/types';
import type { Rng } from '../rng';
import { applyEffects } from './effects';

function seenKey(e: StoryEvent, year: number): string {
  return e.oncePerSeason ? `${e.id}@${year}` : e.id;
}

export function eligibleEvents(state: CareerState, context: StoryEvent['context']): StoryEvent[] {
  const { age } = state.player;
  const stage = state.season.stage;
  return EVENTS.filter((e) => {
    if (e.context !== context) return false;
    if (e.stages && !e.stages.includes(stage)) return false;
    if (e.minAge !== undefined && age < e.minAge) return false;
    if (e.maxAge !== undefined && age > e.maxAge) return false;
    if ((e.once || e.oncePerSeason) && state.seenEvents.includes(seenKey(e, state.season.year))) return false;
    if (e.condition && !e.condition(state)) return false;
    return true;
  });
}

/** Events for the coming offseason: all priority events first, then one or two regular ones. */
export function pickOffseasonEvents(state: CareerState, rng: Rng): string[] {
  const eligible = eligibleEvents(state, 'offseason');
  const queue = eligible.filter((e) => e.priority).slice(0, 2);
  const regular = eligible.filter((e) => !e.priority);
  if (queue.length < 2 && regular.length > 0) {
    const first = rng.weighted(regular, (e) => e.weight);
    queue.push(first);
    const rest = regular.filter((e) => e !== first);
    if (queue.length < 2 && rest.length > 0 && rng.chance(0.3)) {
      queue.push(rng.weighted(rest, (e) => e.weight));
    }
  }
  return queue.map((e) => e.id);
}

export function maybeMidseasonEvent(state: CareerState, rng: Rng): string | null {
  if (state.season.midEventsLeft <= 0 || !rng.chance(0.2)) return null;
  const eligible = eligibleEvents(state, 'midseason');
  if (eligible.length === 0) return null;
  return rng.weighted(eligible, (e) => e.weight).id;
}

export function optionChance(state: CareerState, option: StoryOption): number | null {
  if (!option.roll) return null;
  const p = state.player;
  const ovr = overall(p.skills);
  let chance = option.roll.base;
  for (const [id, w] of Object.entries(option.roll.skills ?? {})) {
    chance += (w as number) * (p.skills[id as keyof typeof p.skills] - ovr) * 0.012;
  }
  if (option.roll.stat) chance += (p[option.roll.stat] - 40) * 0.005;
  return Math.max(0.05, Math.min(0.95, Math.round(chance * 100) / 100));
}

export function buildPendingEvent(state: CareerState, eventId: string, context: PendingEvent['context']): PendingEvent {
  const event = EVENTS_BY_ID[eventId];
  if (!event) throw new Error(`Unknown event ${eventId}`);
  const key = seenKey(event, state.season.year);
  if (!state.seenEvents.includes(key)) state.seenEvents.push(key);
  const vars = {
    first: state.player.first,
    name: `${state.player.first} ${state.player.last}`,
    ...(event.vars ? event.vars(state) : {}),
  };
  return {
    eventId,
    context,
    vars,
    chances: event.options.map((o) => optionChance(state, o)),
    resolved: null,
  };
}

export function isOptionAvailable(state: CareerState, eventId: string, option: number): boolean {
  const opt = EVENTS_BY_ID[eventId]?.options[option];
  if (!opt) return false;
  return opt.cost === undefined || state.finance.budget >= opt.cost;
}

export function resolveEvent(state: CareerState, rng: Rng, pending: PendingEvent, option: number): void {
  const event = EVENTS_BY_ID[pending.eventId];
  const opt = event?.options[option];
  if (!event || !opt) throw new Error('Invalid event option');
  const chance = pending.chances[option] ?? null;
  let success: boolean | null = null;
  let effects = opt.effects;
  if (chance !== null) {
    success = rng.chance(chance);
    effects = success ? opt.effects : (opt.failEffects ?? []);
  }
  applyEffects(state, effects);
  pending.resolved = { option, success, effects };
}
