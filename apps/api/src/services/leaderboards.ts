import { Prisma, type Board as DbBoard } from '@prisma/client';
import type { Board, Champion, LeaderboardEntry } from '@ttg/shared';
import type { Db } from '../db';
import { currentWeek, previousWeek, shiftDay, today } from '../lib/time';

interface Row {
  id: string;
  playerId: string;
  name: string;
  gender: 'M' | 'F';
  legacy: number;
  seasons: number | null;
  peakRank: number | null;
  slamTitles: number | null;
  verdict: string | null;
  displayName: string;
}

export function periodKey(board: Board, now = new Date()): string {
  if (board === 'week') return currentWeek(now);
  if (board === 'all') return 'all';
  return today(now);
}

function filter(board: Board, key: string): Prisma.Sql {
  switch (board) {
    case 'daily':
      return Prisma.sql`c."mode" = 'DAILY' AND c."dayKey" = ${key}`;
    case 'today':
      return Prisma.sql`c."mode" = 'NORMAL' AND c."finishDay" = ${key}`;
    case 'week':
      return Prisma.sql`c."mode" = 'NORMAL' AND c."weekKey" = ${key}`;
    case 'all':
      return Prisma.sql`c."mode" = 'NORMAL'`;
  }
}

/** Best verified career per player in a period, highest LEGACY first. */
export async function topCareers(db: Db, board: Board, key: string, limit: number): Promise<Row[]> {
  return db.$queryRaw<Row[]>(Prisma.sql`
    SELECT * FROM (
      SELECT DISTINCT ON (c."playerId")
        c."id", c."playerId", c."name", c."gender", c."legacy", c."seasons", c."peakRank",
        c."slamTitles", c."verdict", p."displayName"
      FROM "Career" c
      JOIN "Player" p ON p."id" = c."playerId"
      WHERE c."status" = 'FINISHED' AND c."rankable" = true AND c."legacy" IS NOT NULL
        AND ${filter(board, key)}
      ORDER BY c."playerId", c."legacy" DESC, c."finishedAt" ASC
    ) best
    ORDER BY best."legacy" DESC, best."id" ASC
    LIMIT ${limit}
  `);
}

export function toEntries(rows: Row[], meId: string | null): LeaderboardEntry[] {
  return rows.map((r, i) => ({
    position: i + 1,
    careerId: r.id,
    owner: r.displayName,
    name: r.name,
    gender: r.gender,
    legacy: r.legacy,
    seasons: r.seasons ?? 0,
    peakRank: r.peakRank,
    slamTitles: r.slamTitles ?? 0,
    verdict: r.verdict ?? 'unfulfilled',
    isMe: r.playerId === meId,
  }));
}

const DB_BOARD: Record<Exclude<Board, 'all'>, DbBoard> = {
  daily: 'DAILY',
  today: 'TODAY',
  week: 'WEEK',
};

export function previousPeriod(board: Exclude<Board, 'all'>, now = new Date()): string {
  return board === 'week' ? previousWeek(now) : shiftDay(today(now), -1);
}

/** Settle winners of closed periods (idempotent — unique on board + period). */
export async function settleClosedPeriods(db: Db, now = new Date()): Promise<number> {
  let settled = 0;
  for (const board of ['daily', 'today', 'week'] as const) {
    const key = previousPeriod(board, now);
    const exists = await db.periodChampion.findUnique({
      where: { board_periodKey: { board: DB_BOARD[board], periodKey: key } },
    });
    if (exists) continue;
    const [winner] = await topCareers(db, board, key, 1);
    if (!winner) continue;
    await db.periodChampion
      .create({
        data: {
          board: DB_BOARD[board],
          periodKey: key,
          careerId: winner.id,
          playerId: winner.playerId,
          legacy: winner.legacy,
        },
      })
      .then(() => settled++)
      .catch(() => undefined); // another instance settled it first
  }
  return settled;
}

export async function reigningChampion(
  db: Db,
  board: Board,
  now = new Date(),
): Promise<Champion | null> {
  if (board === 'all') return null;
  const key = previousPeriod(board, now);
  const champ = await db.periodChampion.findUnique({
    where: { board_periodKey: { board: DB_BOARD[board], periodKey: key } },
    include: { career: true, player: true },
  });
  if (!champ) return null;
  return {
    board,
    periodKey: key,
    name: champ.career.name,
    owner: champ.player.displayName,
    legacy: champ.legacy,
  };
}

export function boardFromDb(board: DbBoard): Board {
  return board === 'DAILY' ? 'daily' : board === 'TODAY' ? 'today' : 'week';
}
