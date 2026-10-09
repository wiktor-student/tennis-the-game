import { l, type L } from '../i18n';
import type { SkillId, Skills, Surface, SurfaceGroup } from './types';

export const SKILL_IDS: readonly SkillId[] = [
  'serve',
  'return',
  'forehand',
  'backhand',
  'net',
  'fitness',
  'mental',
];

export const SKILL_WEIGHTS: Record<SkillId, number> = {
  serve: 0.18,
  return: 0.16,
  forehand: 0.18,
  backhand: 0.15,
  net: 0.08,
  fitness: 0.12,
  mental: 0.13,
};

export const SKILL_INFO: Record<SkillId, { name: L; short: L; hint: L }> = {
  serve: {
    name: l('Serwis', 'Serve'),
    short: l('Serwis', 'Serve'),
    hint: l('Asy, łatwe gemy serwisowe, szybkie korty', 'Aces, easy service games, fast courts'),
  },
  return: {
    name: l('Return', 'Return'),
    short: l('Return', 'Return'),
    hint: l('Odbiór serwisu i breaki', 'Returning serve and breaking'),
  },
  forehand: {
    name: l('Forhend', 'Forehand'),
    short: l('Forhend', 'Forehand'),
    hint: l('Główna broń w wymianach', 'Your main weapon in rallies'),
  },
  backhand: {
    name: l('Bekhend', 'Backhand'),
    short: l('Bekhend', 'Backhand'),
    hint: l('Obrona, wymiany po przekątnej, return', 'Defence, cross-court rallies, return'),
  },
  net: {
    name: l('Gra przy siatce', 'Net play'),
    short: l('Siatka', 'Net'),
    hint: l('Wolej, serve-and-volley, trawa', 'Volleys, serve-and-volley, grass'),
  },
  fitness: {
    name: l('Kondycja', 'Fitness'),
    short: l('Kondycja', 'Fitness'),
    hint: l(
      'Długie mecze, mączka, mniej kontuzji',
      'Long matches, clay, fewer injuries',
    ),
  },
  mental: {
    name: l('Psychika', 'Mental'),
    short: l('Psychika', 'Mental'),
    hint: l('Break pointy, tie-breaki, decydujące sety', 'Break points, tie-breaks, deciding sets'),
  },
};

export function overall(skills: Skills): number {
  let sum = 0;
  for (const id of SKILL_IDS) sum += skills[id] * SKILL_WEIGHTS[id];
  return Math.round(sum);
}

export function clampSkill(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value * 10) / 10));
}

export function surfaceGroup(surface: Surface): SurfaceGroup {
  return surface === 'indoor' ? 'hard' : surface;
}

export const SURFACE_INFO: Record<Surface, { name: L; short: L }> = {
  clay: { name: l('Mączka', 'Clay'), short: l('Mączka', 'Clay') },
  grass: { name: l('Trawa', 'Grass'), short: l('Trawa', 'Grass') },
  hard: { name: l('Twarda', 'Hard'), short: l('Twarda', 'Hard') },
  indoor: { name: l('Hala', 'Indoor'), short: l('Hala', 'Indoor') },
};
