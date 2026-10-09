import { l, type L } from '../i18n';
import type { Gender, LevelId } from '../model/types';

export interface LevelDef {
  id: LevelId;
  name: Record<Gender, L>;
  /** Short badge text. */
  badge: Record<Gender, string>;
  /** Ranking points by round reached from the end: [W, F, SF, QF, R16, R32, R64, R128]. */
  points: number[];
  /** Points for coming through qualifying. */
  qualPoints: number;
  /** Winner's prize in PLN (0 for junior events). */
  prize: number;
  drawSize: number;
  /** Ranking needed for direct entry / qualifying (pro only). */
  cutoffMain: number;
  cutoffQual: number;
  qualRounds: number;
  /** Best-of-five for men's singles. */
  bestOfFiveMen: boolean;
  /** Prestige ordering used when distributing AI players across a week. */
  prestige: number;
  /** Wildcard difficulty: subtracted from the wildcard chance. */
  wildcardPenalty: number;
  /** Organiser covers the hotel. */
  hospitality: boolean;
  pro: boolean;
}

const PRIZE_SHARE = [1, 0.53, 0.29, 0.16, 0.09, 0.055, 0.035, 0.022];

export function prizeFor(level: LevelDef, reached: number | null): number {
  if (level.prize === 0) return 0;
  if (reached === null) return Math.round(level.prize * 0.006);
  const share = PRIZE_SHARE[Math.min(reached, PRIZE_SHARE.length - 1)] ?? 0.02;
  return Math.round(level.prize * share);
}

export function pointsFor(level: LevelDef, reached: number | null): number {
  if (reached === null) return 0;
  return level.points[reached] ?? 0;
}

const both = (pl: string, en: string = pl): Record<Gender, L> => ({ M: l(pl, en), F: l(pl, en) });

export const LEVELS: Record<LevelId, LevelDef> = {
  gs: {
    id: 'gs',
    name: both('Wielki Szlem', 'Grand Slam'),
    badge: { M: 'GS', F: 'GS' },
    points: [2000, 1300, 800, 400, 200, 100, 50, 10],
    qualPoints: 25,
    prize: 12_000_000,
    drawSize: 128,
    cutoffMain: 104,
    cutoffQual: 230,
    qualRounds: 3,
    bestOfFiveMen: true,
    prestige: 100,
    wildcardPenalty: 0.35,
    hospitality: true,
    pro: true,
  },
  m1000: {
    id: 'm1000',
    name: { M: l('Masters 1000'), F: l('WTA 1000') },
    badge: { M: '1000', F: '1000' },
    points: [1000, 650, 400, 200, 100, 50, 30],
    qualPoints: 20,
    prize: 4_000_000,
    drawSize: 64,
    cutoffMain: 50,
    cutoffQual: 110,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 80,
    wildcardPenalty: 0.25,
    hospitality: true,
    pro: true,
  },
  t500: {
    id: 't500',
    name: { M: l('ATP 500'), F: l('WTA 500') },
    badge: { M: '500', F: '500' },
    points: [500, 330, 200, 100, 50, 25],
    qualPoints: 20,
    prize: 1_600_000,
    drawSize: 32,
    cutoffMain: 40,
    cutoffQual: 90,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 60,
    wildcardPenalty: 0.15,
    hospitality: true,
    pro: true,
  },
  t250: {
    id: 't250',
    name: { M: l('ATP 250'), F: l('WTA 250') },
    badge: { M: '250', F: '250' },
    points: [250, 165, 100, 50, 25, 13],
    qualPoints: 12,
    prize: 450_000,
    drawSize: 32,
    cutoffMain: 80,
    cutoffQual: 180,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 50,
    wildcardPenalty: 0.08,
    hospitality: true,
    pro: true,
  },
  ch175: {
    id: 'ch175',
    name: { M: l('Challenger 175'), F: l('W100') },
    badge: { M: 'CH175', F: 'W100' },
    points: [175, 90, 50, 25, 13, 6],
    qualPoints: 6,
    prize: 120_000,
    drawSize: 32,
    cutoffMain: 130,
    cutoffQual: 260,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 40,
    wildcardPenalty: 0.05,
    hospitality: false,
    pro: true,
  },
  ch125: {
    id: 'ch125',
    name: { M: l('Challenger 125'), F: l('WTA 125') },
    badge: { M: 'CH125', F: '125' },
    points: [125, 64, 35, 16, 8, 5],
    qualPoints: 6,
    prize: 85_000,
    drawSize: 32,
    cutoffMain: 190,
    cutoffQual: 360,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 35,
    wildcardPenalty: 0.03,
    hospitality: false,
    pro: true,
  },
  ch75: {
    id: 'ch75',
    name: { M: l('Challenger 75'), F: l('W75') },
    badge: { M: 'CH75', F: 'W75' },
    points: [75, 44, 22, 12, 6, 3],
    qualPoints: 3,
    prize: 50_000,
    drawSize: 32,
    cutoffMain: 280,
    cutoffQual: 520,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 30,
    wildcardPenalty: 0.02,
    hospitality: false,
    pro: true,
  },
  itf25: {
    id: 'itf25',
    name: { M: l('ITF M25'), F: l('ITF W35') },
    badge: { M: 'M25', F: 'W35' },
    points: [25, 16, 8, 3, 1, 0],
    qualPoints: 1,
    prize: 16_000,
    drawSize: 32,
    cutoffMain: 650,
    cutoffQual: 99_999,
    qualRounds: 2,
    bestOfFiveMen: false,
    prestige: 20,
    wildcardPenalty: 0,
    hospitality: false,
    pro: true,
  },
  itf15: {
    id: 'itf15',
    name: { M: l('ITF M15'), F: l('ITF W15') },
    badge: { M: 'M15', F: 'W15' },
    points: [15, 8, 4, 2, 1, 0],
    qualPoints: 0,
    prize: 10_000,
    drawSize: 32,
    cutoffMain: 99_999,
    cutoffQual: 99_999,
    qualRounds: 0,
    bestOfFiveMen: false,
    prestige: 10,
    wildcardPenalty: 0,
    hospitality: false,
    pro: true,
  },
  finals: {
    id: 'finals',
    name: { M: l('ATP Finals'), F: l('WTA Finals') },
    badge: { M: 'FINALS', F: 'FINALS' },
    // Champion's maximum (undefeated) and per-stage values are computed in the finals runner.
    points: [1500, 1000, 600, 200],
    qualPoints: 0,
    prize: 18_000_000,
    drawSize: 8,
    cutoffMain: 8,
    cutoffQual: 8,
    qualRounds: 0,
    bestOfFiveMen: false,
    prestige: 95,
    wildcardPenalty: 1,
    hospitality: true,
    pro: true,
  },
  olympics: {
    id: 'olympics',
    name: both('Igrzyska Olimpijskie', 'Olympic Games'),
    badge: { M: 'OLY', F: 'OLY' },
    points: [0, 0, 0, 0, 0, 0, 0],
    qualPoints: 0,
    prize: 0,
    drawSize: 64,
    cutoffMain: 56,
    cutoffQual: 56,
    qualRounds: 0,
    bestOfFiveMen: false,
    prestige: 90,
    wildcardPenalty: 1,
    hospitality: true,
    pro: true,
  },

  // ── Juniors (season standings points, no prize money) ──
  j_mini: junior('j_mini', 'Turniej Tenis 10', 'Tennis 10 event', 'T10', [100, 70, 45, 25, 10], 16),
  j_mini_pl: junior('j_mini_pl', 'Mistrzostwa Polski Tenis 10', 'Polish Tennis 10 Championships', 'MP', [200, 140, 90, 50, 20], 16),
  j_nat_b: junior('j_nat_b', 'Turniej ogólnopolski kat. B', 'National event cat. B', 'KAT B', [80, 55, 35, 20, 10, 5], 32),
  j_nat_a: junior('j_nat_a', 'Turniej ogólnopolski kat. A', 'National event cat. A', 'KAT A', [150, 100, 65, 35, 18, 8], 32),
  j_nat_pl: junior('j_nat_pl', 'Mistrzostwa Polski', 'Polish Championships', 'MP', [300, 200, 130, 70, 35, 15], 32),
  te3: junior('te3', 'Tennis Europe kat. 3', 'Tennis Europe cat. 3', 'TE3', [70, 50, 30, 18, 10, 5], 32),
  te2: junior('te2', 'Tennis Europe kat. 2', 'Tennis Europe cat. 2', 'TE2', [120, 85, 55, 30, 15, 8], 32),
  te1: junior('te1', 'Tennis Europe kat. 1', 'Tennis Europe cat. 1', 'TE1', [200, 140, 90, 50, 25, 12], 32),
  te_super: junior('te_super', 'Tennis Europe Super Category', 'Tennis Europe Super Category', 'SUPER', [400, 280, 180, 100, 50, 25], 32),
  te_euro: junior('te_euro', 'Mistrzostwa Europy', 'European Championships', 'EURO', [400, 280, 180, 100, 50, 25], 32),
  j60: junior('j60', 'ITF Juniors J60', 'ITF Juniors J60', 'J60', [60, 36, 22, 12, 6, 3], 32),
  j100: junior('j100', 'ITF Juniors J100', 'ITF Juniors J100', 'J100', [100, 60, 36, 20, 10, 5], 32),
  j200: junior('j200', 'ITF Juniors J200', 'ITF Juniors J200', 'J200', [200, 120, 72, 40, 20, 10], 32),
  j300: junior('j300', 'ITF Juniors J300', 'ITF Juniors J300', 'J300', [300, 180, 108, 60, 30, 15], 32),
  j500: junior('j500', 'ITF Juniors J500', 'ITF Juniors J500', 'J500', [500, 300, 180, 100, 50, 25], 32),
  j_slam: junior('j_slam', 'Juniorski Wielki Szlem', 'Junior Grand Slam', 'JR GS', [1000, 600, 370, 200, 100, 60, 30], 64),
  j_ob: junior('j_ob', 'Orange Bowl', 'Orange Bowl', 'OB', [500, 300, 180, 100, 50, 25], 32),
};

function junior(
  id: LevelId,
  pl: string,
  en: string,
  badge: string,
  points: number[],
  drawSize: number,
): LevelDef {
  return {
    id,
    name: both(pl, en),
    badge: { M: badge, F: badge },
    points,
    qualPoints: 0,
    prize: 0,
    drawSize,
    cutoffMain: 99_999,
    cutoffQual: 99_999,
    qualRounds: 0,
    bestOfFiveMen: false,
    prestige: points[0] ?? 0,
    wildcardPenalty: 0,
    hospitality: false,
    pro: false,
  };
}

/** Round label for a given round-from-end and draw size. */
export function roundLabel(reached: number): string {
  switch (reached) {
    case 0:
      return 'W';
    case 1:
      return 'F';
    case 2:
      return 'SF';
    case 3:
      return 'QF';
    default:
      return `R${2 ** reached}`;
  }
}
