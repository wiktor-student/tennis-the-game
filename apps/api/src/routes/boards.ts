import { dailyCareer, dailyGoals, weeklyChallenge } from '@ttg/engine';
import {
  BoardSchema,
  type DailyResponse,
  type LeaderboardResponse,
  type ProgressResponse,
} from '@ttg/shared';
import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { parse, requirePlayer } from '../http';
import { currentWeek, secondsUntilMidnight, today } from '../lib/time';
import {
  boardFromDb,
  periodKey,
  reigningChampion,
  toEntries,
  topCareers,
} from '../services/leaderboards';
import { careerCard } from '../services/serializers';

const BoardQuery = z.object({
  board: BoardSchema.default('today'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const boardRoutes =
  ({ db }: AppDeps): FastifyPluginAsync =>
  async (app) => {
    app.get('/v1/leaderboards', async (request) => {
      const { board, limit } = parse(BoardQuery, request.query);
      const key = periodKey(board);
      const rows = await topCareers(db, board, key, limit);
      const response: LeaderboardResponse = {
        board,
        periodKey: key,
        entries: toEntries(rows, request.player?.id ?? null),
        reigning: await reigningChampion(db, board),
      };
      return response;
    });

    /** Today's daily career, goals and weekly challenge (progress when authenticated). */
    app.get('/v1/daily', async (request) => {
      const day = today();
      const week = currentWeek();
      const daily = dailyCareer(day);
      const goals = dailyGoals(day);
      const weekly = weeklyChallenge(week);
      const player = request.player;
      const progress = player
        ? await db.goalProgress.findMany({
            where: {
              playerId: player.id,
              goalKey: { in: [...goals.map((g) => g.key), weekly.key] },
            },
          })
        : [];
      const attempted = player
        ? !!(await db.dailyAttempt.findUnique({
            where: { playerId_dayKey: { playerId: player.id, dayKey: day } },
          }))
        : false;
      const byKey = new Map(progress.map((p) => [p.goalKey, p]));
      const response: DailyResponse = {
        dayKey: day,
        weekKey: week,
        seed: daily.seed,
        config: daily.config,
        attempted,
        goals: goals.map((g) => ({
          ...g,
          value: byKey.get(g.key)?.value ?? 0,
          done: !!byKey.get(g.key)?.completedAt,
        })),
        weekly: { ...weekly, done: !!byKey.get(weekly.key)?.completedAt },
        secondsLeft: secondsUntilMidnight(),
      };
      return response;
    });

    /** Museum: achievements, finished careers, personal records and ranking trophies. */
    app.get('/v1/me/progress', async (request) => {
      const player = requirePlayer(request);
      const [achievements, careers, trophies] = await Promise.all([
        db.playerAchievement.findMany({
          where: { playerId: player.id },
          orderBy: { unlockedAt: 'asc' },
        }),
        db.career.findMany({
          where: { playerId: player.id, status: 'FINISHED' },
          orderBy: { finishedAt: 'desc' },
          take: 100,
        }),
        db.periodChampion.findMany({
          where: { playerId: player.id },
          include: { career: true },
          orderBy: { settledAt: 'desc' },
        }),
      ]);
      const cards = careers.map(careerCard);
      const response: ProgressResponse = {
        achievements: achievements.map((a) => ({
          id: a.achievementId,
          unlockedAt: a.unlockedAt.toISOString(),
        })),
        careers: cards,
        records: {
          bestLegacy: Math.max(0, ...cards.filter((c) => c.rankable).map((c) => c.legacy)),
          mostSlams: Math.max(0, ...cards.map((c) => c.slamTitles)),
          bestPeakRank: cards.reduce<number | null>(
            (best, c) =>
              c.peakRank !== null && (best === null || c.peakRank < best) ? c.peakRank : best,
            null,
          ),
          richest: Math.max(0, ...cards.map((c) => c.prizeMoney)),
          careers: cards.length,
        },
        trophies: trophies.map((t) => ({
          board: boardFromDb(t.board),
          periodKey: t.periodKey,
          name: t.career.name,
          owner: player.displayName,
          legacy: t.legacy,
        })),
      };
      return response;
    });
  };
