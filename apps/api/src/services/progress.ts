import type { Player } from '@prisma/client';
import {
  dailyGoals,
  goalProgress,
  weeklyChallenge,
  weeklyDone,
  type CareerSummary,
} from '@ttg/engine';
import type { Db } from '../db';
import { shiftDay } from '../lib/time';

/** Daily streak: consecutive Warsaw days with at least one finished career. */
export function nextStreak(player: Pick<Player, 'streakDays' | 'lastPlayedDay'>, day: string): number {
  if (player.lastPlayedDay === day) return player.streakDays;
  if (player.lastPlayedDay === shiftDay(day, -1)) return player.streakDays + 1;
  return 1;
}

export async function unlockAchievements(db: Db, playerId: string, careerId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const existing = await db.playerAchievement.findMany({ where: { playerId, achievementId: { in: ids } } });
  const have = new Set(existing.map((a) => a.achievementId));
  const fresh = ids.filter((id) => !have.has(id));
  if (fresh.length > 0) {
    await db.playerAchievement.createMany({
      data: fresh.map((achievementId) => ({ playerId, achievementId, careerId })),
      skipDuplicates: true,
    });
  }
  return fresh;
}

async function summariesWhere(db: Db, playerId: string, where: { finishDay?: string; weekKey?: string }): Promise<CareerSummary[]> {
  const careers = await db.career.findMany({
    where: { playerId, status: 'FINISHED', ...where },
    select: { summary: true },
  });
  return careers.map((c) => c.summary as unknown as CareerSummary);
}

/** Recompute daily goals and the weekly challenge for the player after a finished career. */
export async function refreshGoals(db: Db, playerId: string, day: string, week: string): Promise<void> {
  const todays = await summariesWhere(db, playerId, { finishDay: day });
  for (const goal of dailyGoals(day)) {
    const progress = goalProgress(goal, todays);
    await db.goalProgress.upsert({
      where: { playerId_goalKey: { playerId, goalKey: goal.key } },
      create: { playerId, goalKey: goal.key, value: progress.value, target: goal.target, completedAt: progress.done ? new Date() : null },
      update: { value: progress.value, ...(progress.done ? { completedAt: new Date() } : {}) },
    });
  }
  const weekly = weeklyChallenge(week);
  const weeks = await summariesWhere(db, playerId, { weekKey: week });
  const done = weeklyDone(weekly.templateId, weeks);
  await db.goalProgress.upsert({
    where: { playerId_goalKey: { playerId, goalKey: weekly.key } },
    create: { playerId, goalKey: weekly.key, value: done ? 1 : 0, target: 1, completedAt: done ? new Date() : null },
    update: { value: done ? 1 : 0, ...(done ? { completedAt: new Date() } : {}) },
  });
}
