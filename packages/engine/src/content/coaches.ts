import { l, type L } from '../i18n';
import type { CoachId } from '../model/types';

export interface CoachDef {
  id: CoachId;
  name: L;
  description: L;
  /** PLN per season. */
  salary: number;
  growth: number;
  trainingBonus: number;
  /** Added to every match-decision chance. */
  decisionBonus: number;
  minReputation: number;
  mediaPerSeason: number;
}

export const COACHES: Record<CoachId, CoachDef> = {
  dad: {
    id: 'dad',
    name: l('Tata z YouTube', 'Dad with YouTube'),
    description: l(
      'Ogląda tutoriale po nocach. Za darmo, z sercem, z błędami.',
      'Watches tutorials at night. Free, full of heart, full of mistakes.',
    ),
    salary: 0,
    growth: 0.85,
    trainingBonus: 3,
    decisionBonus: -0.02,
    minReputation: 0,
    mediaPerSeason: 0,
  },
  club: {
    id: 'club',
    name: l('Trener klubowy', 'Club coach'),
    description: l(
      'Prowadzi dwadzieścia dzieciaków w hali pneumatycznej. Zna podstawy.',
      'Runs twenty kids in an air-dome hall. Knows the fundamentals.',
    ),
    salary: 12_000,
    growth: 1.0,
    trainingBonus: 4,
    decisionBonus: 0,
    minReputation: 0,
    mediaPerSeason: 0,
  },
  licensed: {
    id: 'licensed',
    name: l('Trener z licencją PZT', 'PZT-licensed coach'),
    description: l(
      'Prowadził kadrę wojewódzką. Ma plan periodyzacji i tablicę.',
      'Coached the regional squad. Has a periodisation plan and a whiteboard.',
    ),
    salary: 35_000,
    growth: 1.1,
    trainingBonus: 4,
    decisionBonus: 0.01,
    minReputation: 10,
    mediaPerSeason: 0,
  },
  academy: {
    id: 'academy',
    name: l('Akademia zagraniczna', 'Foreign academy'),
    description: l(
      'Barcelona albo Floryda. Sparingi z przyszłymi gwiazdami, rachunki jak za studia.',
      'Barcelona or Florida. Sparring with future stars, bills like a university.',
    ),
    salary: 120_000,
    growth: 1.18,
    trainingBonus: 5,
    decisionBonus: 0.015,
    minReputation: 30,
    mediaPerSeason: 1,
  },
  tour: {
    id: 'tour',
    name: l('Trener z touru (ex TOP 50)', 'Tour coach (ex top 50)'),
    description: l(
      'Grał kiedyś w Wimbledonie. Wie, jak wygląda szatnia przed meczem na korcie centralnym.',
      'Once played Wimbledon. Knows the locker room before a centre-court match.',
    ),
    salary: 280_000,
    growth: 1.22,
    trainingBonus: 5,
    decisionBonus: 0.02,
    minReputation: 50,
    mediaPerSeason: 2,
  },
  super: {
    id: 'super',
    name: l('Superkoch (ex mistrz Szlema)', 'Super-coach (ex Slam champion)'),
    description: l(
      'Legenda w twoim boksie. Kamery szaleją, rywale się denerwują.',
      'A legend in your box. Cameras go wild, rivals get nervous.',
    ),
    salary: 900_000,
    growth: 1.28,
    trainingBonus: 6,
    decisionBonus: 0.04,
    minReputation: 75,
    mediaPerSeason: 5,
  },
};

export const COACH_ORDER: CoachId[] = ['dad', 'club', 'licensed', 'academy', 'tour', 'super'];

export const PHYSIO = {
  salary: 60_000,
  injuryReduction: 0.35,
  recovery: 1.3,
};

export const FITNESS_COACH = {
  salary: 45_000,
  declineReduction: 0.5,
  fitnessGrowth: 1.2,
};
