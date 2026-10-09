import { isoWeekKey, warsawDayKey } from '@ttg/engine';

/** All periods (daily career, "today", week) are defined in the Europe/Warsaw time zone. */
export function today(now = new Date()): string {
  return warsawDayKey(now);
}

export function currentWeek(now = new Date()): string {
  return isoWeekKey(today(now));
}

export function shiftDay(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function previousWeek(now = new Date()): string {
  return isoWeekKey(shiftDay(today(now), -7));
}

/** Seconds until the next Warsaw midnight (for the "CEL DNIA · 11 H 55 MIN" countdown). */
export function secondsUntilMidnight(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = get('hour') * 3600 + get('minute') * 60 + get('second');
  return Math.max(0, 86_400 - elapsed);
}
