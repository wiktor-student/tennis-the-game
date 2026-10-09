import { l, type L } from '../i18n';
import type {
  Gender,
  LevelId,
  Region,
  SlamId,
  StageId,
  Surface,
  TournamentDef,
} from '../model/types';

/**
 * Tournament calendars. Tour-level events are hand-written per gender; Challenger and ITF
 * weeks come from a fixed table so their ids are stable across versions and saves.
 * Names identify real-world events for flavour only — the game is not affiliated with them.
 */

type Row = [
  id: string,
  name: string | L,
  city: string | L,
  country: string,
  region: Region,
  level: LevelId,
  surface: Surface,
  week: number,
  span: number,
  genders: 'M' | 'F' | 'MF',
  slam?: SlamId,
];

function def(row: Row, stage: StageId, years?: number[]): TournamentDef {
  const [id, name, city, country, region, level, surface, week, span, genders, slam] = row;
  return {
    id,
    name: typeof name === 'string' ? l(name) : name,
    city: typeof city === 'string' ? l(city) : city,
    country,
    region,
    level,
    surface,
    week,
    span,
    stage,
    genders: genders === 'MF' ? ['M', 'F'] : [genders],
    ...(slam ? { slam } : {}),
    ...(years ? { years } : {}),
  };
}

// ─── Professional tour-level events ──────────────────────────────────────────

const TOUR: Row[] = [
  ['brisbane-m', 'Brisbane International', 'Brisbane', 'AU', 'oc', 't250', 'hard', 1, 1, 'M'],
  ['brisbane-f', 'Brisbane International', 'Brisbane', 'AU', 'oc', 't500', 'hard', 1, 1, 'F'],
  ['adelaide-m', 'Adelaide International', 'Adelaide', 'AU', 'oc', 't250', 'hard', 2, 1, 'M'],
  ['adelaide-f', 'Adelaide International', 'Adelaide', 'AU', 'oc', 't500', 'hard', 2, 1, 'F'],
  ['ao', 'Australian Open', 'Melbourne', 'AU', 'oc', 'gs', 'hard', 3, 2, 'MF', 'ao'],
  ['montpellier', 'Open Occitanie', 'Montpellier', 'FR', 'eu', 't250', 'indoor', 5, 1, 'M'],
  ['abu-dhabi', 'Abu Dhabi Open', 'Abu Zabi', 'AE', 'as', 't500', 'hard', 5, 1, 'F'],
  ['rotterdam', 'Rotterdam Open', 'Rotterdam', 'NL', 'eu', 't500', 'indoor', 6, 1, 'M'],
  ['doha-f', 'Qatar Open', 'Doha', 'QA', 'as', 'm1000', 'hard', 6, 1, 'F'],
  ['rio', 'Rio Open', 'Rio de Janeiro', 'BR', 'am', 't500', 'clay', 7, 1, 'M'],
  ['dubai-f', 'Dubai Tennis Championships', 'Dubaj', 'AE', 'as', 'm1000', 'hard', 7, 1, 'F'],
  ['dubai-m', 'Dubai Tennis Championships', 'Dubaj', 'AE', 'as', 't500', 'hard', 8, 1, 'M'],
  ['austin', 'ATX Open', 'Austin', 'US', 'am', 't250', 'hard', 8, 1, 'F'],
  ['acapulco', 'Abierto Mexicano', 'Acapulco', 'MX', 'am', 't500', 'hard', 9, 1, 'M'],
  ['merida', 'Mérida Open', 'Mérida', 'MX', 'am', 't500', 'hard', 9, 1, 'F'],
  ['indian-wells', 'Indian Wells Open', 'Indian Wells', 'US', 'am', 'm1000', 'hard', 10, 2, 'MF'],
  ['miami', 'Miami Open', 'Miami', 'US', 'am', 'm1000', 'hard', 12, 2, 'MF'],
  ['houston', 'Houston Clay Court Championships', 'Houston', 'US', 'am', 't250', 'clay', 14, 1, 'M'],
  ['charleston', 'Charleston Open', 'Charleston', 'US', 'am', 't500', 'clay', 14, 1, 'F'],
  ['monte-carlo', 'Monte-Carlo Masters', 'Monte Carlo', 'MC', 'eu', 'm1000', 'clay', 15, 1, 'M'],
  ['rouen', 'Open de Rouen', 'Rouen', 'FR', 'eu', 't250', 'clay', 15, 1, 'F'],
  ['barcelona', 'Barcelona Open', 'Barcelona', 'ES', 'eu', 't500', 'clay', 16, 1, 'M'],
  ['stuttgart-f', 'Stuttgart Open', 'Stuttgart', 'DE', 'eu', 't500', 'clay', 16, 1, 'F'],
  ['madrid', 'Madrid Open', 'Madryt', 'ES', 'eu', 'm1000', 'clay', 17, 2, 'MF'],
  ['rome', 'Internazionali d’Italia', l('Rzym', 'Rome'), 'IT', 'eu', 'm1000', 'clay', 19, 2, 'MF'],
  ['hamburg', 'Hamburg Open', 'Hamburg', 'DE', 'eu', 't500', 'clay', 21, 1, 'M'],
  ['strasbourg', 'Internationaux de Strasbourg', 'Strasburg', 'FR', 'eu', 't500', 'clay', 21, 1, 'F'],
  ['rg', 'Roland Garros', l('Paryż', 'Paris'), 'FR', 'eu', 'gs', 'clay', 22, 2, 'MF', 'rg'],
  ['stuttgart-m', 'Stuttgart Open', 'Stuttgart', 'DE', 'eu', 't250', 'grass', 24, 1, 'M'],
  ['hertogenbosch', 'Libéma Open', "'s-Hertogenbosch", 'NL', 'eu', 't250', 'grass', 24, 1, 'F'],
  ['halle', 'Halle Open', 'Halle', 'DE', 'eu', 't500', 'grass', 25, 1, 'M'],
  ['berlin', 'Berlin Tennis Open', 'Berlin', 'DE', 'eu', 't500', 'grass', 25, 1, 'F'],
  ['mallorca', 'Mallorca Championships', 'Majorka', 'ES', 'eu', 't250', 'grass', 26, 1, 'M'],
  ['bad-homburg', 'Bad Homburg Open', 'Bad Homburg', 'DE', 'eu', 't500', 'grass', 26, 1, 'F'],
  ['wimbledon', 'Wimbledon', l('Londyn', 'London'), 'GB', 'eu', 'gs', 'grass', 27, 2, 'MF', 'wim'],
  ['bastad', 'Nordea Open', 'Båstad', 'SE', 'eu', 't250', 'clay', 29, 1, 'M'],
  ['palermo', 'Palermo Ladies Open', 'Palermo', 'IT', 'eu', 't250', 'clay', 29, 1, 'F'],
  ['umag', 'Croatia Open', 'Umag', 'HR', 'eu', 't250', 'clay', 30, 1, 'M'],
  ['warsaw', 'Warsaw Open', l('Warszawa', 'Warsaw'), 'PL', 'pl', 't250', 'hard', 30, 1, 'F'],
  ['washington', 'Washington Open', 'Waszyngton', 'US', 'am', 't500', 'hard', 31, 1, 'MF'],
  ['canada', 'Canadian Open', 'Montreal', 'CA', 'am', 'm1000', 'hard', 32, 2, 'MF'],
  ['cincinnati', 'Cincinnati Open', 'Cincinnati', 'US', 'am', 'm1000', 'hard', 34, 2, 'MF'],
  ['winston-salem', 'Winston-Salem Open', 'Winston-Salem', 'US', 'am', 't250', 'hard', 36, 1, 'M'],
  ['cleveland', 'Tennis in the Land', 'Cleveland', 'US', 'am', 't250', 'hard', 36, 1, 'F'],
  ['uso', 'US Open', 'Nowy Jork', 'US', 'am', 'gs', 'hard', 37, 2, 'MF', 'uso'],
  ['chengdu', 'Chengdu Open', 'Chengdu', 'CN', 'as', 't250', 'hard', 39, 1, 'M'],
  ['seoul', 'Korea Open', 'Seul', 'KR', 'as', 't500', 'hard', 39, 1, 'F'],
  ['beijing-m', 'China Open', l('Pekin', 'Beijing'), 'CN', 'as', 't500', 'hard', 40, 1, 'M'],
  ['beijing-f', 'China Open', l('Pekin', 'Beijing'), 'CN', 'as', 'm1000', 'hard', 40, 2, 'F'],
  ['shanghai', 'Shanghai Masters', l('Szanghaj', 'Shanghai'), 'CN', 'as', 'm1000', 'hard', 41, 2, 'M'],
  ['wuhan', 'Wuhan Open', 'Wuhan', 'CN', 'as', 'm1000', 'hard', 42, 1, 'F'],
  ['stockholm', 'Stockholm Open', 'Sztokholm', 'SE', 'eu', 't250', 'indoor', 43, 1, 'M'],
  ['tokyo', 'Pan Pacific Open', 'Tokio', 'JP', 'as', 't500', 'hard', 43, 1, 'F'],
  ['basel', 'Swiss Indoors', 'Bazylea', 'CH', 'eu', 't500', 'indoor', 44, 1, 'M'],
  ['hong-kong', 'Hong Kong Open', 'Hongkong', 'HK', 'as', 't250', 'hard', 44, 1, 'F'],
  ['paris', 'Paris Masters', l('Paryż', 'Paris'), 'FR', 'eu', 'm1000', 'indoor', 45, 1, 'M'],
  ['finals-f', 'WTA Finals', 'Rijad', 'SA', 'as', 'finals', 'indoor', 45, 1, 'F'],
  ['metz', 'Moselle Open', 'Metz', 'FR', 'eu', 't250', 'indoor', 46, 1, 'M'],
  ['finals-m', 'ATP Finals', 'Turyn', 'IT', 'eu', 'finals', 'indoor', 47, 1, 'M'],
];

const OLYMPICS: { year: number; city: L; region: Region; country: string }[] = [
  { year: 2028, city: l('Los Angeles'), region: 'am', country: 'US' },
  { year: 2032, city: l('Brisbane'), region: 'oc', country: 'AU' },
  ...[2036, 2040, 2044, 2048, 2052, 2056].map((year) => ({
    year,
    city: l('Miasto-gospodarz', 'Host city'),
    region: 'eu' as Region,
    country: 'XX',
  })),
];

// ─── Challenger & ITF weekly table ───────────────────────────────────────────

type Lower = [city: string | L, country: string, region: Region, surface: Surface, level: LevelId];

const CHALLENGERS: Record<number, Lower> = {
  1: ['Canberra', 'AU', 'oc', 'hard', 'ch125'],
  2: ['Nonthaburi', 'TH', 'as', 'hard', 'ch75'],
  3: ['Quimper', 'FR', 'eu', 'indoor', 'ch75'],
  4: ['Oeiras', 'PT', 'eu', 'indoor', 'ch125'],
  5: ['Koblenz', 'DE', 'eu', 'indoor', 'ch75'],
  6: [l('Wrocław'), 'PL', 'pl', 'indoor', 'ch125'],
  7: ['Bergamo', 'IT', 'eu', 'indoor', 'ch125'],
  8: ['Lugano', 'CH', 'eu', 'indoor', 'ch125'],
  9: ['Pune', 'IN', 'as', 'hard', 'ch75'],
  10: ['Phoenix', 'US', 'am', 'hard', 'ch175'],
  11: ['Zadar', 'HR', 'eu', 'clay', 'ch75'],
  12: [l('Neapol', 'Naples'), 'IT', 'eu', 'clay', 'ch125'],
  13: ['Barletta', 'IT', 'eu', 'clay', 'ch75'],
  14: ['Split', 'HR', 'eu', 'clay', 'ch75'],
  15: ['Aix-en-Provence', 'FR', 'eu', 'clay', 'ch175'],
  16: ['Ostrawa', 'CZ', 'eu', 'clay', 'ch75'],
  17: ['Tunis', 'TN', 'eu', 'clay', 'ch75'],
  18: ['Bordeaux', 'FR', 'eu', 'clay', 'ch175'],
  19: ['Heilbronn', 'DE', 'eu', 'clay', 'ch125'],
  20: [l('Praga', 'Prague'), 'CZ', 'eu', 'clay', 'ch75'],
  21: [l('Bratysława', 'Bratislava'), 'SK', 'eu', 'clay', 'ch125'],
  22: ['Prościejów', 'CZ', 'eu', 'clay', 'ch125'],
  23: [l('Poznań'), 'PL', 'pl', 'clay', 'ch125'],
  24: ['Nottingham', 'GB', 'eu', 'grass', 'ch125'],
  25: ['Ilkley', 'GB', 'eu', 'grass', 'ch125'],
  26: [l('Mediolan', 'Milan'), 'IT', 'eu', 'clay', 'ch75'],
  27: ['Brunszwik', 'DE', 'eu', 'clay', 'ch125'],
  28: ['Triest', 'IT', 'eu', 'clay', 'ch75'],
  29: ['Amersfoort', 'NL', 'eu', 'clay', 'ch75'],
  30: ['Tampere', 'FI', 'eu', 'clay', 'ch75'],
  31: ['Segowia', 'ES', 'eu', 'hard', 'ch75'],
  32: ['Cordenons', 'IT', 'eu', 'clay', 'ch75'],
  33: ['Meerbusch', 'DE', 'eu', 'clay', 'ch75'],
  34: ['Como', 'IT', 'eu', 'clay', 'ch75'],
  35: ['Cassis', 'FR', 'eu', 'hard', 'ch75'],
  36: [l('Genua', 'Genoa'), 'IT', 'eu', 'clay', 'ch125'],
  37: [l('Szczecin'), 'PL', 'pl', 'clay', 'ch125'],
  38: ['Sewilla', 'ES', 'eu', 'clay', 'ch75'],
  39: ['Orlean', 'FR', 'eu', 'indoor', 'ch125'],
  40: ['Brest', 'FR', 'eu', 'indoor', 'ch125'],
  41: ['Ortisei', 'IT', 'eu', 'indoor', 'ch75'],
  42: ['Shenzhen', 'CN', 'as', 'hard', 'ch125'],
  43: ['Kobe', 'JP', 'as', 'indoor', 'ch75'],
  44: [l('Bratysława', 'Bratislava'), 'SK', 'eu', 'indoor', 'ch125'],
  45: ['Helsinki', 'FI', 'eu', 'indoor', 'ch75'],
  46: ['Champaign', 'US', 'am', 'indoor', 'ch75'],
  47: ['Maia', 'PT', 'eu', 'clay', 'ch75'],
};

const ITFS: Record<number, Lower> = {};
const ITF_ROTATION: Lower[] = [
  ['Monastir', 'TN', 'eu', 'hard', 'itf15'],
  ['Antalya', 'TR', 'eu', 'clay', 'itf15'],
  ['Szarm el-Szejk', 'EG', 'eu', 'hard', 'itf15'],
  ['Manacor', 'ES', 'eu', 'hard', 'itf25'],
];
const ITF_POLISH: Record<number, Lower> = {
  5: [l('Kozerki'), 'PL', 'pl', 'indoor', 'itf25'],
  12: ['Santa Margherita di Pula', 'IT', 'eu', 'clay', 'itf25'],
  17: [l('Kraków'), 'PL', 'pl', 'clay', 'itf15'],
  19: ['Santa Margherita di Pula', 'IT', 'eu', 'clay', 'itf25'],
  21: [l('Wrocław'), 'PL', 'pl', 'clay', 'itf25'],
  25: [l('Bytom'), 'PL', 'pl', 'clay', 'itf25'],
  28: [l('Kozerki'), 'PL', 'pl', 'clay', 'itf25'],
  29: [l('Gdynia'), 'PL', 'pl', 'clay', 'itf25'],
  32: [l('Koszalin'), 'PL', 'pl', 'clay', 'itf15'],
  35: [l('Szczawno-Zdrój'), 'PL', 'pl', 'clay', 'itf15'],
  46: ['Heraklion', 'GR', 'eu', 'hard', 'itf25'],
};
for (let week = 1; week <= 47; week++) {
  ITFS[week] = ITF_POLISH[week] ?? (ITF_ROTATION[week % ITF_ROTATION.length] as Lower);
}

function slug(text: string | L): string {
  const raw = typeof text === 'string' ? text : text.en;
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function lowerDef(prefix: 'ch' | 'itf', week: number, row: Lower): TournamentDef {
  const [city, country, region, surface, level] = row;
  const cityL = typeof city === 'string' ? l(city) : city;
  const label = prefix === 'ch' ? 'Challenger' : 'ITF';
  return {
    id: `${prefix}-w${String(week).padStart(2, '0')}-${slug(city)}`,
    name: { pl: `${label} ${cityL.pl}`, en: `${label} ${cityL.en}` },
    city: cityL,
    country,
    region,
    level,
    surface,
    week,
    span: 1,
    stage: 'pro',
    genders: ['M', 'F'],
  };
}

// ─── Junior calendars ────────────────────────────────────────────────────────

const JUNIOR: Record<Exclude<StageId, 'pro'>, Row[]> = {
  mini: [
    ['mini-lodz', l('Turniej Orlika — Łódź', 'Orlik Cup — Łódź'), l('Łódź'), 'PL', 'pl', 'j_mini', 'indoor', 6, 1, 'MF'],
    ['mini-warszawa', l('Grand Prix Mazowsza', 'Masovia Grand Prix'), l('Warszawa', 'Warsaw'), 'PL', 'pl', 'j_mini', 'hard', 14, 1, 'MF'],
    ['mini-poznan', l('Turniej Skrzatów — Poznań', 'Poznań Junior Cup'), l('Poznań'), 'PL', 'pl', 'j_mini', 'clay', 20, 1, 'MF'],
    ['mini-sopot', l('Puchar Bałtyku', 'Baltic Cup'), l('Sopot'), 'PL', 'pl', 'j_mini', 'clay', 28, 1, 'MF'],
    ['mini-mp', l('Mistrzostwa Polski Tenis 10', 'Polish Tennis 10 Championships'), l('Bydgoszcz'), 'PL', 'pl', 'j_mini_pl', 'clay', 33, 1, 'MF'],
    ['mini-krakow', l('Masters Tenis 10 — Kraków', 'Tennis 10 Masters — Kraków'), l('Kraków', 'Krakow'), 'PL', 'pl', 'j_mini', 'indoor', 44, 1, 'MF'],
  ],
  national: [
    ['nat-olsztyn', l('Turniej kat. B — Olsztyn', 'Cat. B — Olsztyn'), l('Olsztyn'), 'PL', 'pl', 'j_nat_b', 'indoor', 4, 1, 'MF'],
    ['nat-gliwice', l('Turniej kat. A — Gliwice', 'Cat. A — Gliwice'), l('Gliwice'), 'PL', 'pl', 'j_nat_a', 'indoor', 8, 1, 'MF'],
    ['nat-hmp', l('Halowe Mistrzostwa Polski', 'Polish Indoor Championships'), l('Kozerki'), 'PL', 'pl', 'j_nat_pl', 'indoor', 11, 1, 'MF'],
    ['nat-wroclaw', l('Turniej kat. A — Wrocław', 'Cat. A — Wrocław'), l('Wrocław'), 'PL', 'pl', 'j_nat_a', 'clay', 19, 1, 'MF'],
    ['nat-zielona', l('Turniej kat. B — Zielona Góra', 'Cat. B — Zielona Góra'), l('Zielona Góra'), 'PL', 'pl', 'j_nat_b', 'clay', 24, 1, 'MF'],
    ['nat-lmp', l('Letnie Mistrzostwa Polski', 'Polish Summer Championships'), l('Bytom'), 'PL', 'pl', 'j_nat_pl', 'clay', 30, 1, 'MF'],
    ['nat-sopot', l('Turniej kat. A — Sopot', 'Cat. A — Sopot'), l('Sopot'), 'PL', 'pl', 'j_nat_a', 'clay', 35, 1, 'MF'],
    ['nat-masters', l('Masters PZT', 'PZT Masters'), l('Warszawa', 'Warsaw'), 'PL', 'pl', 'j_nat_a', 'indoor', 46, 1, 'MF'],
  ],
  europe: [
    ['te-ostrava', l('Tennis Europe — Ostrawa', 'Tennis Europe — Ostrava'), l('Ostrawa', 'Ostrava'), 'CZ', 'eu', 'te3', 'indoor', 3, 1, 'MF'],
    ['te-tarbes', l('Les Petits As'), l('Tarbes'), 'FR', 'eu', 'te_super', 'indoor', 5, 1, 'MF'],
    ['te-bratislava', l('Tennis Europe — Bratysława', 'Tennis Europe — Bratislava'), l('Bratysława', 'Bratislava'), 'SK', 'eu', 'te2', 'indoor', 9, 1, 'MF'],
    ['te-kozerki', l('Tennis Europe — Kozerki', 'Tennis Europe — Kozerki'), l('Kozerki'), 'PL', 'pl', 'te1', 'clay', 18, 1, 'MF'],
    ['te-avvenire', l('Trofeo Avvenire'), l('Mediolan', 'Milan'), 'IT', 'eu', 'te_super', 'clay', 22, 1, 'MF'],
    ['te-bol', l('Tennis Europe — Bol', 'Tennis Europe — Bol'), l('Bol'), 'HR', 'eu', 'te2', 'clay', 26, 1, 'MF'],
    ['te-euro', l('Mistrzostwa Europy', 'European Championships'), l('Klosters'), 'CH', 'eu', 'te_euro', 'clay', 30, 1, 'MF'],
    ['te-vienna', l('Tennis Europe — Wiedeń', 'Tennis Europe — Vienna'), l('Wiedeń', 'Vienna'), 'AT', 'eu', 'te1', 'clay', 34, 1, 'MF'],
    ['te-budapest', l('Tennis Europe Masters — Budapeszt', 'Tennis Europe Masters — Budapest'), l('Budapeszt', 'Budapest'), 'HU', 'eu', 'te1', 'indoor', 43, 1, 'MF'],
  ],
  itf_junior: [
    ['j-traralgon', l('J300 Traralgon'), l('Traralgon'), 'AU', 'oc', 'j300', 'hard', 2, 1, 'MF'],
    ['j-ao', l('Australian Open Junior'), l('Melbourne'), 'AU', 'oc', 'j_slam', 'hard', 4, 1, 'MF', 'ao'],
    ['j-santacroce', l('J200 Santa Croce'), l('Santa Croce'), 'IT', 'eu', 'j200', 'clay', 15, 1, 'MF'],
    ['j-bonfiglio', l('J500 Trofeo Bonfiglio'), l('Mediolan', 'Milan'), 'IT', 'eu', 'j500', 'clay', 20, 1, 'MF'],
    ['j-rg', l('Roland Garros Junior'), l('Paryż', 'Paris'), 'FR', 'eu', 'j_slam', 'clay', 23, 1, 'MF', 'rg'],
    ['j-roehampton', l('J300 Roehampton'), l('Londyn', 'London'), 'GB', 'eu', 'j300', 'grass', 26, 1, 'MF'],
    ['j-wim', l('Wimbledon Junior'), l('Londyn', 'London'), 'GB', 'eu', 'j_slam', 'grass', 28, 1, 'MF', 'wim'],
    ['j-bytom', l('J100 Bytom'), l('Bytom'), 'PL', 'pl', 'j100', 'clay', 31, 1, 'MF'],
    ['j-uso', l('US Open Junior'), l('Nowy Jork', 'New York'), 'US', 'am', 'j_slam', 'hard', 38, 1, 'MF', 'uso'],
    ['j-osaka', l('J500 Osaka Mayor’s Cup'), l('Osaka'), 'JP', 'as', 'j500', 'hard', 42, 1, 'MF'],
    ['j-orange', l('Orange Bowl'), l('Plantation'), 'US', 'am', 'j_ob', 'clay', 50, 1, 'MF'],
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

const ALL: TournamentDef[] = [];

for (const row of TOUR) ALL.push(def(row, 'pro'));
for (const games of OLYMPICS) {
  ALL.push({
    id: `olympics-${games.year}`,
    name: l(`Igrzyska Olimpijskie ${games.year}`, `Olympic Games ${games.year}`),
    city: games.city,
    country: games.country,
    region: games.region,
    level: 'olympics',
    surface: 'hard',
    week: 30,
    span: 2,
    stage: 'pro',
    genders: ['M', 'F'],
    years: [games.year],
  });
}
for (const [week, row] of Object.entries(CHALLENGERS)) ALL.push(lowerDef('ch', Number(week), row));
for (const [week, row] of Object.entries(ITFS)) ALL.push(lowerDef('itf', Number(week), row));
for (const [stage, rows] of Object.entries(JUNIOR)) {
  for (const row of rows) ALL.push(def(row, stage as StageId));
}

export const TOURNAMENTS: Readonly<Record<string, TournamentDef>> = Object.fromEntries(
  ALL.map((t) => [t.id, t]),
);

export function tournament(id: string): TournamentDef {
  const found = TOURNAMENTS[id];
  if (!found) throw new Error(`Unknown tournament: ${id}`);
  return found;
}

export function juniorCalendar(stage: Exclude<StageId, 'pro'>): TournamentDef[] {
  return ALL.filter((t) => t.stage === stage).sort((a, b) => a.week - b.week);
}

/** Tour-level events for a gender and year (Olympics included when held). */
export function tourEvents(gender: Gender, year: number): TournamentDef[] {
  return ALL.filter(
    (t) =>
      t.stage === 'pro' &&
      t.genders.includes(gender) &&
      !t.id.startsWith('ch-') &&
      !t.id.startsWith('itf-') &&
      (!t.years || t.years.includes(year)),
  ).sort((a, b) => a.week - b.week);
}

export function lowerTierForWeek(week: number): TournamentDef[] {
  return ALL.filter(
    (t) => t.week === week && (t.id.startsWith('ch-') || t.id.startsWith('itf-')),
  );
}
