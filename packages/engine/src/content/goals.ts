import { l, type L } from '../i18n';
import type { CareerSummary } from '../model/summary';

/**
 * Daily goals and weekly challenges. Progress aggregates over all careers finished in the
 * period: `sum` adds values across careers, `max` takes the best single career.
 */
export interface GoalTemplate {
  id: string;
  name: L;
  /** `{x}` is replaced with the target (formatted by the UI). */
  description: L;
  aggregate: 'sum' | 'max';
  targets: number[];
  value: (s: CareerSummary) => number;
  /** Display unit hint for the UI. */
  unit?: 'mln' | 'rank';
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'money', name: l('Gruby portfel', 'Fat wallet'),
    description: l('Zarób łącznie {x} mln zł', 'Earn {x}m zł in total'),
    aggregate: 'sum', targets: [5, 10, 20, 35, 50], unit: 'mln',
    value: (s) => Math.floor(s.prizeMoney / 1_000_000),
  },
  {
    id: 'titles', name: l('Kolekcjoner', 'Collector'),
    description: l('Zdobądź łącznie {x} tytułów zawodowych', 'Win {x} professional titles in total'),
    aggregate: 'sum', targets: [2, 5, 10, 15],
    value: (s) => s.proTitles,
  },
  {
    id: 'peak', name: l('Wspinaczka', 'The climb'),
    description: l('Wejdź do TOP {x} rankingu', 'Break into the top {x}'),
    aggregate: 'max', targets: [200, 100, 50, 20, 10], unit: 'rank',
    value: (s) => s.peakRank ?? 9999,
  },
  {
    id: 'legacy', name: l('Ślad w historii', 'Leave a mark'),
    description: l('Zdobądź {x} LEGACY w jednej karierze', 'Earn {x} LEGACY in a single career'),
    aggregate: 'max', targets: [500, 1000, 2000, 3000],
    value: (s) => s.legacy,
  },
  {
    id: 'slams', name: l('Wielkie turnieje', 'The big four'),
    description: l('Wygraj łącznie {x} turniej(e) Wielkiego Szlema', 'Win {x} Grand Slam(s) in total'),
    aggregate: 'sum', targets: [1, 2, 3],
    value: (s) => s.slamTitles,
  },
  {
    id: 'clay', name: l('Ceglany pył', 'Brick dust'),
    description: l('Wygraj łącznie {x} turniejów na mączce', 'Win {x} clay tournaments in total'),
    aggregate: 'sum', targets: [2, 4, 6],
    value: (s) => s.surfaceTitles.clay,
  },
  {
    id: 'grass', name: l('Biała koszulka', 'All white'),
    description: l('Wygraj łącznie {x} turniej(e) na trawie', 'Win {x} grass tournament(s) in total'),
    aggregate: 'sum', targets: [1, 2, 3],
    value: (s) => s.surfaceTitles.grass,
  },
  {
    id: 'junior', name: l('Młody wilk', 'Young wolf'),
    description: l('Zdobądź łącznie {x} juniorski(e) tytuł(y) wielkoszlemowy(e)', 'Win {x} junior Slam title(s) in total'),
    aggregate: 'sum', targets: [1, 2],
    value: (s) => s.juniorSlamTitles,
  },
  {
    id: 'wins', name: l('Seryjny zwycięzca', 'Serial winner'),
    description: l('Wygraj łącznie {x} meczów zawodowych', 'Win {x} professional matches in total'),
    aggregate: 'sum', targets: [100, 200, 400],
    value: (s) => s.proWins,
  },
];

export interface WeeklyTemplate {
  id: string;
  name: L;
  description: L;
  /** A single career must satisfy all parts. */
  check: (s: CareerSummary) => boolean;
}

export const WEEKLY_TEMPLATES: WeeklyTemplate[] = [
  {
    id: 'clean_rich', name: l('Góra bez rysy', 'Not a scratch'),
    description: l('Zarób 15 mln zł i zakończ karierę bez poważnej kontuzji', 'Earn 15m zł and retire without a serious injury'),
    check: (s) => s.prizeMoney >= 15_000_000 && s.seriousInjuries === 0,
  },
  {
    id: 'wall_top50', name: l('Spod bloku', 'From the block'),
    description: l('Startując spod bloku, wejdź do TOP 50', 'Starting from the block wall, reach the top 50'),
    check: (s) => s.background === 'wall' && (s.peakRank ?? 9999) <= 50,
  },
  {
    id: 'hard_title', name: l('Twarda sztuka', 'Tough cookie'),
    description: l('Na poziomie Trudnym zdobądź 5 tytułów zawodowych', 'Win 5 pro titles on Hard difficulty'),
    check: (s) => s.difficulty === 'hard' && s.proTitles >= 5,
  },
  {
    id: 'junior_to_top20', name: l('Obietnica spełniona', 'Promise kept'),
    description: l('Wygraj juniorskiego Szlema i wejdź do TOP 20', 'Win a junior Slam and reach the top 20'),
    check: (s) => s.juniorSlamTitles >= 1 && (s.peakRank ?? 9999) <= 20,
  },
  {
    id: 'olympian', name: l('Olimpijski sen', 'Olympic dream'),
    description: l('Zdobądź medal olimpijski i 2000 LEGACY', 'Win an Olympic medal and 2000 LEGACY'),
    check: (s) => s.olympic.gold + s.olympic.silver + s.olympic.bronze >= 1 && s.legacy >= 2000,
  },
  {
    id: 'surface_master', name: l('Na każdej nawierzchni', 'Every surface'),
    description: l('Wygraj tytuł na mączce, trawie i korcie twardym w jednej karierze', 'Win titles on clay, grass and hard in one career'),
    check: (s) => s.surfaceTitles.clay > 0 && s.surfaceTitles.grass > 0 && s.surfaceTitles.hard > 0,
  },
];
