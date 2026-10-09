import { l, type L } from '../i18n';
import type { CareerSummary } from '../model/summary';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legend';

export interface AchievementDef {
  id: string;
  name: L;
  description: L;
  tier: AchievementTier;
  /** Hidden until unlocked. */
  secret?: boolean;
  check: (s: CareerSummary) => boolean;
}

const g = (male: string, female: string) => `[[${male}|${female}]]`;

export const ACHIEVEMENTS: AchievementDef[] = [
  // Juniors
  {
    id: 'first_title',
    tier: 'bronze',
    name: l('Pierwszy puchar', 'First trophy'),
    description: l('Wygraj dowolny turniej.', 'Win any tournament.'),
    check: (s) => s.titles >= 1,
  },
  {
    id: 'polish_champion',
    tier: 'bronze',
    name: l('Mistrzostwo Polski', 'Polish champion'),
    description: l('Wygraj juniorskie Mistrzostwa Polski.', 'Win a junior Polish Championship.'),
    check: (s) => s.polishChampionships >= 1,
  },
  {
    id: 'petits_as',
    tier: 'silver',
    name: l('Mały As', 'Little Ace'),
    description: l('Wygraj Les Petits As w Tarbes.', 'Win Les Petits As in Tarbes.'),
    check: (s) => s.petitsAs,
  },
  {
    id: 'orange_bowl',
    tier: 'silver',
    name: l('Pomarańczowa Misa', 'Orange Bowl'),
    description: l('Wygraj Orange Bowl.', 'Win the Orange Bowl.'),
    check: (s) => s.orangeBowl,
  },
  {
    id: 'junior_slam',
    tier: 'silver',
    name: l('Juniorski Szlem', 'Junior Slam'),
    description: l('Wygraj juniorski turniej wielkoszlemowy.', 'Win a junior Grand Slam.'),
    check: (s) => s.juniorSlamTitles >= 1,
  },
  {
    id: 'junior_no1',
    tier: 'silver',
    name: l('Najlepszy junior świata', 'World junior No. 1'),
    description: l(
      'Zakończ rok jako nr 1 rankingu juniorów ITF.',
      'Finish a year as ITF junior No. 1.',
    ),
    check: (s) => s.juniorYearEndNo1,
  },
  {
    id: 'early_pro',
    tier: 'bronze',
    name: l('Za młody na Szlema juniorów', 'Too young for juniors'),
    description: l('Przejdź na zawodowstwo w wieku 17 lat.', 'Turn pro at 17.'),
    check: (s) => s.turnedProAge === 17,
  },

  // Ranking
  {
    id: 'top100',
    tier: 'bronze',
    name: l('Klub TOP 100', 'Top 100 club'),
    description: l('Wejdź do pierwszej setki rankingu.', 'Break into the top 100.'),
    check: (s) => (s.peakRank ?? 9999) <= 100,
  },
  {
    id: 'top10',
    tier: 'silver',
    name: l('Pierwsza dziesiątka', 'Top ten'),
    description: l('Wejdź do TOP 10.', 'Break into the top 10.'),
    check: (s) => (s.peakRank ?? 9999) <= 10,
  },
  {
    id: 'no1',
    tier: 'gold',
    name: l('Numer jeden', 'World No. 1'),
    description: l('Zostań liderem rankingu.', 'Become world No. 1.'),
    check: (s) => s.peakRank === 1,
  },
  {
    id: 'no1_52',
    tier: 'legend',
    name: l('Rok na tronie', 'A year on the throne'),
    description: l(
      'Spędź łącznie 52 tygodnie na pozycji nr 1.',
      'Spend a total of 52 weeks at No. 1.',
    ),
    check: (s) => s.weeksAtNo1 >= 52,
  },
  {
    id: 'year_end_no1',
    tier: 'gold',
    name: l('Mistrz roku', 'Year-end No. 1'),
    description: l('Zakończ sezon jako nr 1.', 'Finish a season as No. 1.'),
    check: (s) => s.yearEndNo1 >= 1,
  },

  // Titles
  {
    id: 'pro_title',
    tier: 'bronze',
    name: l('Zawodowy tytuł', 'Pro title'),
    description: l(
      'Wygraj turniej zawodowy (dowolna ranga).',
      'Win a professional tournament of any level.',
    ),
    check: (s) => s.proTitles >= 1,
  },
  {
    id: 'ten_titles',
    tier: 'silver',
    name: l('Dwucyfrowo', 'Double digits'),
    description: l('Zdobądź 10 tytułów zawodowych.', 'Win 10 professional titles.'),
    check: (s) => s.proTitles >= 10,
  },
  {
    id: 'masters',
    tier: 'silver',
    name: l('Tysiąc punktów', 'A thousand points'),
    description: l('Wygraj turniej rangi 1000.', 'Win a 1000-level event.'),
    check: (s) => s.m1000Titles >= 1,
  },
  {
    id: 'finals_title',
    tier: 'gold',
    name: l('Mistrz Finałów', 'Finals champion'),
    description: l('Wygraj turniej finałowy sezonu.', 'Win the season finals.'),
    check: (s) => s.finalsTitles >= 1,
  },
  {
    id: 'clay_king',
    tier: 'gold',
    name: l(g('Król mączki', 'Królowa mączki'), g('King of clay', 'Queen of clay')),
    description: l('Zdobądź 10 tytułów na mączce.', 'Win 10 titles on clay.'),
    check: (s) => s.surfaceTitles.clay >= 10,
  },
  {
    id: 'grass_master',
    tier: 'gold',
    name: l('Trawnik na własność', 'Lawn owner'),
    description: l('Zdobądź 5 tytułów na trawie.', 'Win 5 titles on grass.'),
    check: (s) => s.surfaceTitles.grass >= 5,
  },
  {
    id: 'qualifier_champ',
    tier: 'silver',
    name: l('Z kwalifikacji po puchar', 'From qualifying to the trophy'),
    description: l(
      'Wygraj turniej, zaczynając od kwalifikacji.',
      'Win a tournament after coming through qualifying.',
    ),
    check: (s) => s.qualifierTitles >= 1,
  },
  {
    id: 'wildcard_champ',
    tier: 'silver',
    name: l('Dzika karta, dziki tytuł', 'Wildcard, wild title'),
    description: l('Wygraj turniej z dziką kartą.', 'Win a tournament on a wildcard.'),
    check: (s) => s.wildcardTitles >= 1,
  },

  // Slams
  {
    id: 'slam',
    tier: 'gold',
    name: l('Wielkoszlemowy mistrz', 'Grand Slam champion'),
    description: l('Wygraj turniej Wielkiego Szlema.', 'Win a Grand Slam.'),
    check: (s) => s.slamTitles >= 1,
  },
  {
    id: 'ao',
    tier: 'gold',
    name: l('Melbourne Park', 'Melbourne Park'),
    description: l('Wygraj Australian Open.', 'Win the Australian Open.'),
    check: (s) => s.slams.ao >= 1,
  },
  {
    id: 'rg',
    tier: 'gold',
    name: l('Ziemia z Paryża', 'Paris clay'),
    description: l('Wygraj Roland Garros.', 'Win Roland Garros.'),
    check: (s) => s.slams.rg >= 1,
  },
  {
    id: 'wim',
    tier: 'gold',
    name: l('Centre Court', 'Centre Court'),
    description: l('Wygraj Wimbledon.', 'Win Wimbledon.'),
    check: (s) => s.slams.wim >= 1,
  },
  {
    id: 'uso',
    tier: 'gold',
    name: l('Flushing Meadows', 'Flushing Meadows'),
    description: l('Wygraj US Open.', 'Win the US Open.'),
    check: (s) => s.slams.uso >= 1,
  },
  {
    id: 'career_slam',
    tier: 'legend',
    name: l('Karierowy Wielki Szlem', 'Career Grand Slam'),
    description: l('Wygraj wszystkie cztery turnieje wielkoszlemowe.', 'Win all four Grand Slams.'),
    check: (s) => s.slams.ao > 0 && s.slams.rg > 0 && s.slams.wim > 0 && s.slams.uso > 0,
  },
  {
    id: 'golden_slam',
    tier: 'legend',
    secret: true,
    name: l('Złoty Szlem', 'Golden Slam'),
    description: l(
      'Karierowy Wielki Szlem i olimpijskie złoto.',
      'Career Grand Slam plus Olympic gold.',
    ),
    check: (s) =>
      s.slams.ao > 0 && s.slams.rg > 0 && s.slams.wim > 0 && s.slams.uso > 0 && s.olympic.gold > 0,
  },
  {
    id: 'ten_slams',
    tier: 'legend',
    secret: true,
    name: l('Dwucyfrowy Szlem', 'Double-digit Slams'),
    description: l('Zdobądź 10 tytułów wielkoszlemowych.', 'Win 10 Grand Slam titles.'),
    check: (s) => s.slamTitles >= 10,
  },
  {
    id: 'wall_to_wimbledon',
    tier: 'legend',
    secret: true,
    name: l('Od ściany do Wimbledonu', 'From the wall to Wimbledon'),
    description: l(
      'Zacznij pod blokiem i wygraj Wimbledon.',
      'Start at the block wall and win Wimbledon.',
    ),
    check: (s) => s.background === 'wall' && s.slams.wim >= 1,
  },
  {
    id: 'hard_slam',
    tier: 'gold',
    name: l('Pod wiatr', 'Against the wind'),
    description: l('Wygraj Szlema na poziomie Trudnym.', 'Win a Slam on Hard difficulty.'),
    check: (s) => s.difficulty === 'hard' && s.slamTitles >= 1,
  },

  // Olympics & national team
  {
    id: 'olympic_medal',
    tier: 'silver',
    name: l('Olimpijczyk z medalem', 'Olympic medallist'),
    description: l('Zdobądź medal olimpijski.', 'Win an Olympic medal.'),
    check: (s) => s.olympic.gold + s.olympic.silver + s.olympic.bronze >= 1,
  },
  {
    id: 'olympic_gold',
    tier: 'gold',
    name: l('Złoto dla Polski', 'Gold for Poland'),
    description: l('Zdobądź olimpijskie złoto.', 'Win Olympic gold.'),
    check: (s) => s.olympic.gold >= 1,
  },
  {
    id: 'davis_cup',
    tier: 'gold',
    name: l('Drużyna narodowa', 'National team'),
    description: l(
      'Wygraj Puchar Davisa / Billie Jean King Cup.',
      'Win the Davis Cup / Billie Jean King Cup.',
    ),
    check: (s) => s.davisCup >= 1,
  },

  // Money
  {
    id: 'millionaire',
    tier: 'bronze',
    name: l('Pierwszy milion', 'First million'),
    description: l('Zarób 1 mln zł na kortach.', 'Earn 1 million zł in prize money.'),
    check: (s) => s.prizeMoney >= 1_000_000,
  },
  {
    id: 'rich',
    tier: 'silver',
    name: l('Gruby portfel', 'Fat wallet'),
    description: l('Zarób 35 mln zł na kortach.', 'Earn 35 million zł in prize money.'),
    check: (s) => s.prizeMoney >= 35_000_000,
  },
  {
    id: 'tycoon',
    tier: 'gold',
    name: l('Imperium', 'Empire'),
    description: l('Zarób 150 mln zł na kortach.', 'Earn 150 million zł in prize money.'),
    check: (s) => s.prizeMoney >= 150_000_000,
  },
  {
    id: 'debt_survivor',
    tier: 'silver',
    name: l('Z długów do setki', 'From debt to the top 100'),
    description: l(
      'Wyjdź z długu ponad 50 tys. zł i wejdź do TOP 100.',
      'Climb out of a 50k zł debt and reach the top 100.',
    ),
    check: (s) => s.maxDebt <= -50_000 && (s.peakRank ?? 9999) <= 100,
  },

  // Matches
  {
    id: 'super_decisions',
    tier: 'silver',
    name: l('Instynkt', 'Instinct'),
    description: l(
      'Zalicz 15 wyników SUPER w decyzjach meczowych.',
      'Score 15 SUPER outcomes in match decisions.',
    ),
    check: (s) => s.decisionsSuper >= 15,
  },
  {
    id: 'nemesis_slayer',
    tier: 'silver',
    name: l('Rachunki wyrównane', 'Score settled'),
    description: l('Pokonaj swojego Nemesis 5 razy.', 'Beat your Nemesis 5 times.'),
    check: (s) => s.nemesisWon >= 5,
  },
  {
    id: 'marathon',
    tier: 'bronze',
    name: l('Maratończyk', 'Marathon runner'),
    description: l('Wygraj 5 meczów w pięciu setach.', 'Win 5 five-set matches.'),
    check: (s) => s.fiveSetWins >= 5,
  },
  {
    id: 'double_bagel',
    tier: 'bronze',
    name: l('Dwa bajgle', 'Double bagel'),
    description: l('Wygraj mecz 6-0 6-0.', 'Win a match 6-0 6-0.'),
    check: (s) => s.doubleBagels >= 1,
  },
  {
    id: 'giant_killer',
    tier: 'silver',
    name: l('Pogromca faworytów', 'Giant killer'),
    description: l(
      'Pokonaj zawodnika TOP 10, będąc poza setką.',
      'Beat a top-10 player while ranked outside the top 100.',
    ),
    check: (s) => s.bigUpsets >= 1,
  },
  {
    id: 'clean_career',
    tier: 'silver',
    name: l('Góra bez rysy', 'Not a scratch'),
    description: l(
      'Wejdź do TOP 50 i zakończ karierę bez poważnej kontuzji.',
      'Reach the top 50 and retire without a serious injury.',
    ),
    check: (s) => s.seriousInjuries === 0 && (s.peakRank ?? 9999) <= 50,
  },
  {
    id: 'iron',
    tier: 'silver',
    name: l('Żelazne płuca', 'Iron lungs'),
    description: l('Graj zawodowo do 36. roku życia.', 'Play professionally until 36.'),
    check: (s) => s.finalAge >= 36,
  },

  // Legacy
  {
    id: 'legacy_1000',
    tier: 'bronze',
    name: l('Ślad w historii', 'A mark in history'),
    description: l('Zdobądź 1000 LEGACY.', 'Earn 1000 LEGACY.'),
    check: (s) => s.legacy >= 1000,
  },
  {
    id: 'legacy_3000',
    tier: 'silver',
    name: l('Rozdział w encyklopedii', 'An encyclopaedia chapter'),
    description: l('Zdobądź 3000 LEGACY.', 'Earn 3000 LEGACY.'),
    check: (s) => s.legacy >= 3000,
  },
  {
    id: 'legacy_5000',
    tier: 'gold',
    name: l('Pomnik przed kortem', 'A statue by the court'),
    description: l('Zdobądź 5000 LEGACY.', 'Earn 5000 LEGACY.'),
    check: (s) => s.legacy >= 5000,
  },
  {
    id: 'dad_coach',
    tier: 'gold',
    secret: true,
    name: l('Tata wiedział', 'Dad knew'),
    description: l(
      'Wejdź do TOP 100 z tatą jako trenerem.',
      'Reach the top 100 with dad as your coach.',
    ),
    check: (s) => s.flags.includes('dad_top100'),
  },
];

export function evaluateAchievements(summary: CareerSummary): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(summary)).map((a) => a.id);
}
