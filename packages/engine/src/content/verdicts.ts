import { l, type L } from '../i18n';
import type { CareerSummary } from '../model/summary';

export interface VerdictDef {
  id: string;
  title: L;
  text: L;
  match: (s: CareerSummary) => boolean;
}

/** Ordered — the first matching verdict wins. */
export const VERDICTS: VerdictDef[] = [
  {
    id: 'debt',
    title: l('Kariera na kredyt', 'A career on credit'),
    text: l(
      'Talent był, pieniądze się skończyły. Komornik nie ogląda tenisa.',
      "The talent was there, the money ran out. Bailiffs don't watch tennis.",
    ),
    match: (s) => s.retireReason === 'debt',
  },
  {
    id: 'goat',
    title: l('GOAT znad Wisły', 'GOAT from the Vistula'),
    text: l(
      'Pomniki, ulice twojego imienia i dzieci z rakietami pod każdym blokiem. Historia tenisa ma nowy rozdział.',
      'Statues, streets named after you and kids with rackets by every block. Tennis history has a new chapter.',
    ),
    match: (s) => s.legacy >= 6000 || s.slamTitles >= 8,
  },
  {
    id: 'legend',
    title: l('Legenda kortu', 'Legend of the court'),
    text: l(
      'Twoje mecze będą pokazywać w przerwach na deszcz za pięćdziesiąt lat.',
      'Your matches will be replayed during rain delays fifty years from now.',
    ),
    match: (s) => s.legacy >= 4000 || s.slamTitles >= 4,
  },
  {
    id: 'great',
    title: l('Wielki mistrz', 'Great champion'),
    text: l(
      'Kilka Szlemów i miejsce w każdej dyskusji o najlepszych.',
      'Several Slams and a place in every greatest-ever debate.',
    ),
    match: (s) => s.slamTitles >= 2,
  },
  {
    id: 'slam_champion',
    title: l('Mistrz wielkoszlemowy', 'Grand Slam champion'),
    text: l(
      'Ten jeden turniej zmienił wszystko. Nikt ci go już nie odbierze.',
      'That one tournament changed everything. Nobody can take it away.',
    ),
    match: (s) => s.slamTitles >= 1,
  },
  {
    id: 'number_one',
    title: l('Numer jeden', 'World No. 1'),
    text: l(
      'Bez Szlema, ale z koroną. Lista liderów rankingu ma polskie nazwisko.',
      'No Slam, but a crown. The list of No. 1s has a Polish name.',
    ),
    match: (s) => s.peakRank === 1,
  },
  {
    id: 'elite',
    title: l('Czołówka światowa', 'World elite'),
    text: l(
      'Pierwsza dziesiątka, Finały i wielkie korty. Zabrakło jednego kroku.',
      'Top ten, the Finals and the big courts. One step was missing.',
    ),
    match: (s) => (s.peakRank ?? 9999) <= 10,
  },
  {
    id: 'top50',
    title: l('Solidna pięćdziesiątka', 'Solid top 50'),
    text: l(
      'Główne drabinki, rozstawienia i stabilne życie z tenisa.',
      'Main draws, seedings and a stable living from tennis.',
    ),
    match: (s) => (s.peakRank ?? 9999) <= 50,
  },
  {
    id: 'top100',
    title: l('Klub TOP 100', 'Top 100 club'),
    text: l(
      'Bezpośrednie wejście do Szlemów — marzenie milionów dzieci, które spełniłeś[[|aś]].',
      'Direct entry into Slams — the dream of millions of kids, and you lived it.',
    ),
    match: (s) => (s.peakRank ?? 9999) <= 100,
  },
  {
    id: 'junior_meteor',
    title: l('Juniorski meteor', 'Junior meteor'),
    text: l(
      'Juniorski Szlem obiecywał wszystko. Dorosły tenis okazał się inną grą.',
      'The junior Slam promised everything. Pro tennis turned out to be a different game.',
    ),
    match: (s) => s.juniorSlamTitles >= 1 || s.juniorYearEndNo1,
  },
  {
    id: 'challenger',
    title: l('Challengerowy wojownik', 'Challenger warrior'),
    text: l(
      'Monastir, Szczecin, Sewilla. Tysiące kilometrów i każdy punkt wywalczony.',
      'Monastir, Szczecin, Seville. Thousands of kilometres and every point earned.',
    ),
    match: (s) => (s.peakRank ?? 9999) <= 300,
  },
  {
    id: 'injury',
    title: l('Pech zdrowotny', 'Cursed by injuries'),
    text: l('Ciało nie nadążyło za ambicją.', 'The body could not keep up with the ambition.'),
    match: (s) => s.retireReason === 'injury',
  },
  {
    id: 'unfulfilled',
    title: l('Talent, który nie zakwitł', 'The talent that never bloomed'),
    text: l(
      'Ściana za blokiem pamięta lepsze dni.',
      'The wall behind the block remembers better days.',
    ),
    match: () => true,
  },
];

export function verdictFor(summary: CareerSummary): VerdictDef {
  return VERDICTS.find((v) => v.match(summary)) as VerdictDef;
}

export const VERDICTS_BY_ID: Readonly<Record<string, VerdictDef>> = Object.fromEntries(
  VERDICTS.map((v) => [v.id, v]),
);
