import { ENGINE_VERSION, dailyCareer, type Action, type CareerConfig } from '@ttg/engine';
import {
  FinishCareerSchema,
  StartCareerSchema,
  type FinishCareerResponse,
  type StartCareerResponse,
} from '@ttg/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { HttpError, parse, requirePlayer } from '../http';
import { currentWeek, today } from '../lib/time';
import { newSeed } from '../lib/tokens';
import { topCareers } from '../services/leaderboards';
import { nextStreak, refreshGoals, unlockAchievements } from '../services/progress';
import { careerCard } from '../services/serializers';

export const careerRoutes =
  ({ db, pool }: AppDeps): FastifyPluginAsync =>
  async (app) => {
    /** Issue a seed. Daily careers: one attempt per player and day. */
    app.post('/v1/careers', async (request, reply) => {
      const player = requirePlayer(request);
      const body = parse(StartCareerSchema, request.body);
      const day = today();

      let seed: string;
      let config: CareerConfig;
      let dayKey: string | null = null;
      if (body.mode === 'daily') {
        const daily = dailyCareer(day);
        seed = daily.seed;
        config = daily.config;
        dayKey = day;
        const attempted = await db.dailyAttempt.findUnique({ where: { playerId_dayKey: { playerId: player.id, dayKey: day } } });
        if (attempted) throw new HttpError(409, 'daily_already_attempted', 'Kariera Dnia została już dziś rozpoczęta');
      } else {
        seed = newSeed();
        config = { ...body.config, mode: 'normal' };
      }

      const career = await db.$transaction(async (tx) => {
        const created = await tx.career.create({
          data: {
            playerId: player.id,
            mode: body.mode === 'daily' ? 'DAILY' : 'NORMAL',
            seed,
            engineVersion: ENGINE_VERSION,
            config: config as object,
            dayKey,
            name: `${config.name.first} ${config.name.last}`,
            gender: config.gender,
            background: config.background,
            difficulty: config.difficulty,
            rankable: config.background !== 'chosen',
          },
        });
        if (dayKey) await tx.dailyAttempt.create({ data: { playerId: player.id, dayKey, careerId: created.id } });
        return created;
      });

      const response: StartCareerResponse = { careerId: career.id, seed, config, engineVersion: ENGINE_VERSION, dayKey };
      return reply.status(201).send(response);
    });

    /** Submit the action log; the server replays it and stores the verified result. */
    app.post(
      '/v1/careers/:id/finish',
      { bodyLimit: 2_000_000, config: { rateLimit: { max: 12, timeWindow: '1 minute' } } },
      async (request) => {
        const player = requirePlayer(request);
        const { id } = request.params as { id: string };
        const body = parse(FinishCareerSchema, request.body);
        const career = await db.career.findUnique({ where: { id } });
        if (!career || career.playerId !== player.id) throw new HttpError(404, 'not_found', 'Career not found');
        if (career.status !== 'ACTIVE') throw new HttpError(409, 'already_finished', 'Career already submitted');

        const result = await pool.verify({
          config: career.config as unknown as CareerConfig,
          seed: career.seed,
          engineVersion: career.engineVersion,
          actions: body.actions as Action[],
        });
        if (!result.ok) {
          await db.career.update({ where: { id }, data: { status: 'REJECTED', rejectReason: result.reason, finishedAt: new Date() } });
          request.log.warn({ careerId: id, reason: result.reason }, 'career rejected');
          throw new HttpError(422, 'verification_failed', 'Career could not be verified', { reason: result.reason });
        }

        const s = result.summary;
        const day = today();
        const week = currentWeek();
        const finished = await db.career.update({
          where: { id },
          data: {
            status: 'FINISHED',
            finishedAt: new Date(),
            finishDay: day,
            weekKey: week,
            legacy: s.legacy,
            rankable: s.rankable,
            verdict: s.verdict,
            seasons: s.seasons,
            peakRank: s.peakRank,
            slamTitles: s.slamTitles,
            titles: s.titles,
            prizeMoney: BigInt(Math.round(s.prizeMoney)),
            summary: s as object,
            actions: body.actions as object,
            actionCount: result.actionCount,
          },
        });

        const streakDays = nextStreak(player, day);
        await db.player.update({ where: { id: player.id }, data: { streakDays, lastPlayedDay: day } });
        const newAchievements = await unlockAchievements(db, player.id, id, result.achievements);
        await refreshGoals(db, player.id, day, week);

        const position = async (board: 'daily' | 'today' | 'week', key: string) => {
          const rows = await topCareers(db, board, key, 100);
          const idx = rows.findIndex((r) => r.id === id);
          return idx >= 0 ? idx + 1 : null;
        };
        const isDaily = finished.mode === 'DAILY';
        const response: FinishCareerResponse = {
          verified: true,
          career: careerCard(finished),
          newAchievements,
          positions: {
            daily: isDaily && finished.dayKey ? await position('daily', finished.dayKey) : null,
            today: isDaily ? null : await position('today', day),
            week: isDaily ? null : await position('week', week),
          },
          streakDays,
        };
        return response;
      },
    );

    app.get('/v1/careers/:id', async (request) => {
      const { id } = request.params as { id: string };
      const career = await db.career.findUnique({ where: { id } });
      if (!career || career.status !== 'FINISHED') throw new HttpError(404, 'not_found', 'Career not found');
      return { career: careerCard(career), summary: career.summary };
    });
  };
