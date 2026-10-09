import type { Career, Player } from '@prisma/client';
import type { CareerCard, PlayerDto } from '@ttg/shared';

export function playerDto(p: Player): PlayerDto {
  return {
    id: p.id,
    displayName: p.displayName,
    locale: p.locale,
    selectedRacket: p.selectedRacket,
    streakDays: p.streakDays,
    createdAt: p.createdAt.toISOString(),
  };
}

export function careerCard(c: Career): CareerCard {
  return {
    careerId: c.id,
    mode: c.mode === 'DAILY' ? 'daily' : 'normal',
    name: c.name,
    gender: c.gender,
    background: c.background as CareerCard['background'],
    difficulty: c.difficulty as CareerCard['difficulty'],
    legacy: c.legacy ?? 0,
    verdict: c.verdict ?? 'unfulfilled',
    seasons: c.seasons ?? 0,
    peakRank: c.peakRank,
    slamTitles: c.slamTitles ?? 0,
    titles: c.titles ?? 0,
    prizeMoney: Number(c.prizeMoney ?? 0),
    finishedAt: (c.finishedAt ?? c.startedAt).toISOString(),
    rankable: c.rankable,
  };
}
