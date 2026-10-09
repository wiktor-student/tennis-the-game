import {
  dailyGoals,
  evaluateAchievements,
  goalProgress,
  isoWeekKey,
  warsawDayKey,
  weeklyChallenge,
  weeklyDone,
  type CareerSummary,
} from '@ttg/engine';
import { create } from 'zustand';
import { load, save } from '../lib/storage';

/**
 * Meta-progress kept in the browser (works offline): achievements, the museum of finished
 * careers, daily streak and goal progress. The server keeps its own verified copy for
 * leaderboards and trophies.
 */
export interface MuseumEntry {
  id: string;
  finishedAt: number;
  day: string;
  week: string;
  summary: CareerSummary;
  online: boolean;
}

interface MetaState {
  achievements: Record<string, number>;
  museum: MuseumEntry[];
  streak: number;
  lastPlayedDay: string | null;
  dailyAttempted: string | null;
  recordCareer: (summary: CareerSummary, online: boolean) => string[];
  markDailyAttempt: (day: string) => void;
  wipe: () => void;
}

const stored = load<Partial<MetaState>>('meta', {});

function persist(s: MetaState) {
  save('meta', {
    achievements: s.achievements,
    museum: s.museum.slice(0, 200),
    streak: s.streak,
    lastPlayedDay: s.lastPlayedDay,
    dailyAttempted: s.dailyAttempted,
  });
}

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

export const useMeta = create<MetaState>((set, get) => ({
  achievements: stored.achievements ?? {},
  museum: stored.museum ?? [],
  streak: stored.streak ?? 0,
  lastPlayedDay: stored.lastPlayedDay ?? null,
  dailyAttempted: stored.dailyAttempted ?? null,

  recordCareer: (summary, online) => {
    const day = warsawDayKey();
    const state = get();
    const unlocked = evaluateAchievements(summary).filter((id) => !(id in state.achievements));
    const now = Date.now();
    const achievements = { ...state.achievements };
    for (const id of unlocked) achievements[id] = now;
    const streak =
      state.lastPlayedDay === day
        ? state.streak
        : state.lastPlayedDay === previousDay(day)
          ? state.streak + 1
          : 1;
    const entry: MuseumEntry = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      finishedAt: now,
      day,
      week: isoWeekKey(day),
      summary,
      online,
    };
    set({ achievements, museum: [entry, ...state.museum], streak, lastPlayedDay: day });
    persist(get());
    return unlocked;
  },

  markDailyAttempt: (day) => {
    set({ dailyAttempted: day });
    persist(get());
  },

  wipe: () => {
    set({ achievements: {}, museum: [], streak: 0, lastPlayedDay: null, dailyAttempted: null });
    persist(get());
  },
}));

/** Local goal progress for today and this week (mirrors the server computation). */
export function localGoals(museum: MuseumEntry[], day = warsawDayKey()) {
  const todays = museum.filter((m) => m.day === day).map((m) => m.summary);
  const week = isoWeekKey(day);
  const weekly = weeklyChallenge(week);
  return {
    goals: dailyGoals(day).map((g) => ({ ...g, ...goalProgress(g, todays) })),
    weekly: {
      ...weekly,
      done: weeklyDone(
        weekly.templateId,
        museum.filter((m) => m.week === week).map((m) => m.summary),
      ),
    },
  };
}

export function currentStreak(meta: Pick<MetaState, 'streak' | 'lastPlayedDay'>): number {
  const day = warsawDayKey();
  if (meta.lastPlayedDay === day || meta.lastPlayedDay === previousDay(day)) return meta.streak;
  return 0;
}
