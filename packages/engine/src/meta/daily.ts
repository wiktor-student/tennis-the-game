import { GOAL_TEMPLATES, WEEKLY_TEMPLATES, type GoalTemplate } from '../content/goals';
import { polishName } from '../content/names';
import type { CareerSummary } from '../model/summary';
import type { BackgroundId, CareerConfig, Gender } from '../model/types';
import { Rng } from '../rng';

/**
 * Daily career: everybody gets the same player and seed for a given day key (YYYY-MM-DD,
 * Europe/Warsaw). Only the first attempt counts — enforced by the API.
 */
export function dailyCareer(dayKey: string): { seed: string; config: CareerConfig } {
  const rng = Rng.fromSeed(`daily-config:${dayKey}`);
  const gender: Gender = rng.chance(0.5) ? 'M' : 'F';
  const name = polishName(rng, gender);
  const background = rng.weighted<BackgroundId>(['wall', 'sponsor_kid', 'academy'], (b) =>
    b === 'wall' ? 3 : 1,
  );
  return {
    seed: `daily:${dayKey}`,
    config: {
      name: { first: name.first, last: name.last },
      gender,
      background,
      difficulty: 'normal',
      mode: 'daily',
    },
  };
}

export interface DailyGoal {
  key: string;
  templateId: string;
  target: number;
}

export function dailyGoals(dayKey: string): DailyGoal[] {
  const rng = Rng.fromSeed(`goals:${dayKey}`);
  const pool = [...GOAL_TEMPLATES];
  const goals: DailyGoal[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const template = rng.pick(pool);
    pool.splice(pool.indexOf(template), 1);
    goals.push({ key: `daily:${dayKey}:${i}`, templateId: template.id, target: rng.pick(template.targets) });
  }
  return goals;
}

export function weeklyChallenge(weekKey: string): { key: string; templateId: string } {
  const rng = Rng.fromSeed(`weekly:${weekKey}`);
  const template = rng.pick(WEEKLY_TEMPLATES);
  return { key: `weekly:${weekKey}`, templateId: template.id };
}

/** Progress of a daily goal across the careers finished in its period. */
export function goalProgress(goal: DailyGoal, summaries: CareerSummary[]): { value: number; done: boolean } {
  const template = GOAL_TEMPLATES.find((t) => t.id === goal.templateId) as GoalTemplate;
  if (template.unit === 'rank') {
    const best = Math.min(9999, ...summaries.map((s) => template.value(s)));
    return { value: best, done: best <= goal.target };
  }
  const values = summaries.map((s) => template.value(s));
  const value = template.aggregate === 'sum' ? values.reduce((a, b) => a + b, 0) : Math.max(0, ...values);
  return { value, done: value >= goal.target };
}

export function weeklyDone(templateId: string, summaries: CareerSummary[]): boolean {
  const template = WEEKLY_TEMPLATES.find((t) => t.id === templateId);
  return !!template && summaries.some((s) => template.check(s));
}

/** ISO week key, e.g. "2026-W41", for a YYYY-MM-DD day key. */
export function isoWeekKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Day key in the Europe/Warsaw time zone. */
export function warsawDayKey(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
  return parts;
}
