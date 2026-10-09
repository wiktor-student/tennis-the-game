import { l, type L } from '../i18n';
import type { CoachId, PlayStyle, SkillId, Surface } from '../model/types';

/**
 * Tactic cards — the player's game plans. Before key matches the player reads a scouting
 * report and plays one card; ordinary matches use the preferred card. A card's edge depends
 * on the opponent's style, the surface, how well the card suits the player's own strengths
 * and how well the player has mastered it.
 *
 * `vsStyle` and `surface` are in percentage points of serve-point probability.
 */
export interface TacticDef {
  id: string;
  name: L;
  /** One line shown on the card. */
  motto: L;
  /** Longer explanation for the card back / tooltip. */
  description: L;
  skills: Partial<Record<SkillId, number>>;
  vsStyle: Record<PlayStyle, number>;
  surface: Partial<Record<Surface, number>>;
  /** 0 = steady, 1+ = volatile (per-set swing). */
  risk: number;
  /** Coach that can teach the card; null = starter card. */
  teacher: CoachId | null;
  minAge: number;
  /** Card artwork motif used by the UI. */
  glyph:
    | 'baseline'
    | 'arrow'
    | 'serve'
    | 'arc'
    | 'net'
    | 'chip'
    | 'drop'
    | 'return'
    | 'wall'
    | 'curve'
    | 'mind'
    | 'bolt';
}

export const TACTICS: TacticDef[] = [
  {
    id: 'baseline',
    name: l('Solidnie z głębi', 'Solid from the baseline'),
    motto: l('Jedna piłka więcej niż rywal.', 'One more ball than your rival.'),
    description: l(
      'Głębokie, bezpieczne piłki i cierpliwość. Mało błędów, mało fajerwerków. Dobre na rywali, którzy żyją z akcji przy siatce.',
      'Deep, safe balls and patience. Few errors, few fireworks. Good against players who live at the net.',
    ),
    skills: { forehand: 0.35, backhand: 0.35, fitness: 0.3 },
    vsStyle: { server: 0.6, grinder: -1.2, allround: 0, netrusher: 1.6 },
    surface: { clay: 0.6, grass: -0.4 },
    risk: 0.2,
    teacher: null,
    minAge: 0,
    glyph: 'baseline',
  },
  {
    id: 'backhand_attack',
    name: l('Atak na bekhend', 'Attack the backhand'),
    motto: l('Znajdź słabszą stronę i nie odpuszczaj.', 'Find the weaker wing and stay on it.'),
    description: l(
      'Każda wymiana zaczyna się od piłki w bekhend rywala. Działa na wszechstronnych i serwujących, mniej na maszyny z głębi kortu.',
      'Every rally starts with a ball to the backhand. Works on all-rounders and servers, less on baseline machines.',
    ),
    skills: { forehand: 0.6, return: 0.4 },
    vsStyle: { server: 0.8, grinder: 0, allround: 1.6, netrusher: 0.6 },
    surface: { hard: 0.4 },
    risk: 0.4,
    teacher: null,
    minAge: 0,
    glyph: 'arrow',
  },
  {
    id: 'big_serve',
    name: l('Serwis i pierwszy forhend', 'Serve plus one'),
    motto: l('Dwa uderzenia i po punkcie.', 'Two shots and the point is over.'),
    description: l(
      'Mocny pierwszy serwis i atak forhendem w pierwszej piłce. Szybkie korty to raj, mączka — czyściec.',
      'A big first serve and a forehand on the first ball. Fast courts are heaven, clay is purgatory.',
    ),
    skills: { serve: 0.6, forehand: 0.4 },
    vsStyle: { server: -0.6, grinder: 1.6, allround: 0.8, netrusher: 0 },
    surface: { grass: 1.6, indoor: 1.2, clay: -1.4 },
    risk: 0.5,
    teacher: null,
    minAge: 0,
    glyph: 'serve',
  },
  {
    id: 'grind',
    name: l('Wojna na wyniszczenie', 'War of attrition'),
    motto: l('Trzecia godzina należy do ciebie.', 'The third hour belongs to you.'),
    description: l(
      'Wydłużasz wymiany, biegasz do każdej piłki i czekasz, aż rywalowi zabraknie paliwa. Wymaga kondycji i głowy.',
      'You lengthen rallies, chase every ball and wait for your rival to run out of fuel. Needs legs and nerve.',
    ),
    skills: { fitness: 0.6, mental: 0.4 },
    vsStyle: { server: 1.4, grinder: -0.8, allround: 0.6, netrusher: 0.2 },
    surface: { clay: 1.4, grass: -0.8 },
    risk: 0.1,
    teacher: 'club',
    minAge: 0,
    glyph: 'wall',
  },
  {
    id: 'moonball',
    name: l('Wysokie topspiny', 'High topspin'),
    motto: l(
      'Piłka nad głową rywala, rytm w strzępach.',
      'Ball over their head, rhythm in tatters.',
    ),
    description: l(
      'Ciężkie, wysokie piłki w bekhend. Rozbijają rytm serwujących i płaskich graczy, ale bywają prezentem dla siatkarzy.',
      'Heavy, high balls to the backhand. They break the rhythm of servers and flat hitters, but feed net-rushers.',
    ),
    skills: { forehand: 0.4, backhand: 0.3, fitness: 0.3 },
    vsStyle: { server: 1.6, grinder: -0.6, allround: 0.8, netrusher: -1.6 },
    surface: { clay: 1.6, grass: -1.6 },
    risk: 0.3,
    teacher: 'licensed',
    minAge: 10,
    glyph: 'arc',
  },
  {
    id: 'return_deep',
    name: l('Return w nogi', 'Return at the feet'),
    motto: l('Każdy serwis wraca pod stopy serwującego.', 'Every serve comes back at their feet.'),
    description: l(
      'Stajesz bliżej, blokujesz serwis nisko pod nogi. Zabójcze na serwujących i siatkarzy, bez efektu na cierpliwych.',
      'You stand closer and block the serve low at their feet. Deadly against servers and net-rushers, toothless against grinders.',
    ),
    skills: { return: 0.7, backhand: 0.3 },
    vsStyle: { server: 2, grinder: -0.8, allround: 0.4, netrusher: 1.4 },
    surface: { grass: 0.6 },
    risk: 0.3,
    teacher: 'licensed',
    minAge: 10,
    glyph: 'return',
  },
  {
    id: 'drop_shots',
    name: l('Skróty i loby', 'Drops and lobs'),
    motto: l('Niech biega — do przodu i do tyłu.', 'Make them run — forwards and back.'),
    description: l(
      'Wyciągasz rywala do siatki skrótem, a potem przerzucasz lobem. Męczy cierpliwych, ale siatkarze się tylko cieszą.',
      'Drag them in with a drop shot, then lob over. Wears out grinders, but net-rushers love it.',
    ),
    skills: { net: 0.4, forehand: 0.3, mental: 0.3 },
    vsStyle: { server: 0.6, grinder: 2, allround: 0.4, netrusher: -1.6 },
    surface: { clay: 1.2, grass: -0.6 },
    risk: 0.7,
    teacher: 'academy',
    minAge: 12,
    glyph: 'drop',
  },
  {
    id: 'inside_out',
    name: l('Forhend z odwrotnego krosa', 'Inside-out forehand'),
    motto: l('Obiegasz bekhend i strzelasz.', 'Run around the backhand and fire.'),
    description: l(
      'Ustawiasz się tak, by grać forhendem co drugą piłkę, i dyktujesz warunki z lewego narożnika. Wymaga dobrego forhendu i nóg.',
      'You set up to hit a forehand on every other ball and dictate from the ad corner. Needs a big forehand and legs.',
    ),
    skills: { forehand: 0.8, fitness: 0.2 },
    vsStyle: { server: 0.2, grinder: 1, allround: 1.4, netrusher: 0.2 },
    surface: { hard: 0.8, indoor: 0.6 },
    risk: 0.5,
    teacher: 'academy',
    minAge: 12,
    glyph: 'curve',
  },
  {
    id: 'serve_volley',
    name: l('Serwis i wolej', 'Serve and volley'),
    motto: l('Do siatki po każdym serwisie.', 'Rush the net behind every serve.'),
    description: l(
      'Stara szkoła. Na trawie i w hali potrafi zmiażdżyć graczy z głębi kortu. Na mączce to proszenie się o mijające.',
      'Old school. On grass and indoors it crushes baseliners. On clay it is begging to be passed.',
    ),
    skills: { serve: 0.5, net: 0.5 },
    vsStyle: { server: -0.6, grinder: 2.4, allround: 0.8, netrusher: -0.8 },
    surface: { grass: 2.4, indoor: 1, clay: -2.4 },
    risk: 0.9,
    teacher: 'tour',
    minAge: 15,
    glyph: 'net',
  },
  {
    id: 'chip_charge',
    name: l('Chip and charge', 'Chip and charge'),
    motto: l('Krótki slajs na returnie i do przodu.', 'Short slice return and charge.'),
    description: l(
      'Odbierasz serwis podciętym slajsem i od razu biegniesz do siatki. Zaskakuje serwujących, którzy nie lubią niskich piłek.',
      'Chip the return low and rush in. Surprises big servers who hate low balls.',
    ),
    skills: { return: 0.5, net: 0.5 },
    vsStyle: { server: 2.4, grinder: -0.8, allround: 0.6, netrusher: 0 },
    surface: { grass: 1.6, clay: -1 },
    risk: 0.8,
    teacher: 'tour',
    minAge: 15,
    glyph: 'chip',
  },
  {
    id: 'mind_games',
    name: l('Gra w głowie rywala', 'Head games'),
    motto: l(
      'Zmieniasz tempo, zmieniasz rytm, zmieniasz wszystko.',
      'Change pace, change rhythm, change everything.',
    ),
    description: l(
      'Mieszasz wszystko: slajs, topspin, skrót, długie przerwy między punktami. Działa na każdego, jeśli masz głowę mocniejszą od niego.',
      'You mix everything: slice, topspin, drops, long pauses between points. Works on anyone — if your head is stronger than theirs.',
    ),
    skills: { mental: 1 },
    vsStyle: { server: 1, grinder: 1, allround: 1, netrusher: 1 },
    surface: {},
    risk: 0.6,
    teacher: 'tour',
    minAge: 17,
    glyph: 'mind',
  },
  {
    id: 'all_in',
    name: l('Wszystko albo nic', 'All or nothing'),
    motto: l('Każda piłka w linię.', 'Every ball at the line.'),
    description: l(
      'Ryzykujesz każde uderzenie. W dobry dzień nikt cię nie zatrzyma, w zły — przegrasz z każdym.',
      'You go for every shot. On a good day no one can stop you; on a bad one you lose to anyone.',
    ),
    skills: { forehand: 0.4, serve: 0.3, mental: 0.3 },
    vsStyle: { server: 1.6, grinder: 1.6, allround: 1.6, netrusher: 1.6 },
    surface: {},
    risk: 1.6,
    teacher: 'super',
    minAge: 18,
    glyph: 'bolt',
  },
];

export const TACTICS_BY_ID: Readonly<Record<string, TacticDef>> = Object.fromEntries(
  TACTICS.map((t) => [t.id, t]),
);

export const STARTER_TACTICS = TACTICS.filter((t) => t.teacher === null).map((t) => t.id);

/** Wins needed for mastery levels 1, 2 and 3. */
export const MASTERY_WINS = [6, 18, 40] as const;

export const STYLE_INFO: Record<PlayStyle, { name: L; scout: L }> = {
  server: {
    name: l('Bombardier serwisowy', 'Big server'),
    scout: l(
      'Wygrywa punkty serwisem i pierwszym uderzeniem. Nie lubi długich wymian ani niskich returnów.',
      'Wins points with the serve and the first strike. Hates long rallies and low returns.',
    ),
  },
  grinder: {
    name: l('Ściana z głębi kortu', 'Baseline wall'),
    scout: l(
      'Odbiera wszystko i czeka na twój błąd. Rozbija go gra przy siatce i zmiany rytmu.',
      'Gets everything back and waits for your mistake. Net play and changes of pace break them.',
    ),
  },
  allround: {
    name: l('Wszechstronny', 'All-rounder'),
    scout: l(
      'Nie ma wyraźnej słabości, ale też nie ma broni, której trzeba się bać. Szukaj słabszej strony.',
      'No obvious weakness, but no weapon to fear either. Look for the weaker wing.',
    ),
  },
  netrusher: {
    name: l('Siatkarz', 'Net-rusher'),
    scout: l(
      'Biegnie do siatki przy każdej okazji. Kara przychodzi z mijających i returnów pod nogi.',
      'Rushes the net at every chance. Passing shots and returns at the feet punish it.',
    ),
  },
};
