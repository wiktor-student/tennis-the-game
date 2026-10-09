import { l, type L } from '../i18n';
import type { SponsorCategory, SponsorCondition } from '../model/types';

/** All sponsors are fictional. Tier: 1 local · 2 regional · 3 national · 4 global. */
export interface SponsorTemplate {
  id: string;
  name: string;
  category: SponsorCategory;
  tier: 1 | 2 | 3 | 4;
  amount: [number, number];
  seasons: [number, number];
  perk: L;
  condition?: SponsorCondition;
  proOnly?: boolean;
}

export const SPONSORS: SponsorTemplate[] = [
  // Tier 1 — local
  {
    id: 'bakery', name: 'Piekarnia u Zenka', category: 'main', tier: 1, amount: [3000, 8000], seasons: [1, 2],
    perk: l('zdjęcie z bochenkiem na festynie gminnym', 'a photo with a loaf at the village fair'),
  },
  {
    id: 'windows', name: 'Hurtownia Okien Domex', category: 'main', tier: 1, amount: [5000, 12000], seasons: [1, 2],
    perk: l('mecz pokazowy na otwarciu nowego salonu', 'an exhibition at the new showroom opening'),
  },
  {
    id: 'smecz', name: 'Sklep Sportowy Smecz', category: 'apparel', tier: 1, amount: [2000, 6000], seasons: [1, 3],
    perk: l('koszulki z nadrukiem robionym w piwnicy', 'shirts screen-printed in a basement'),
  },
  {
    id: 'mietek', name: 'Serwis Rakiet u Mietka', category: 'racket', tier: 1, amount: [2000, 5000], seasons: [1, 3],
    perk: l('darmowe naciągi do końca roku', 'free restringing until the end of the year'),
  },
  {
    id: 'carwash', name: 'Myjnia Bąbelek', category: 'main', tier: 1, amount: [4000, 9000], seasons: [1, 2],
    perk: l('dwa razy w roku mycie busa klubowego', 'washing the club minibus twice a year'),
  },
  // Tier 2 — regional
  {
    id: 'coop_bank', name: 'Bank Spółdzielczy Mazowsze', category: 'main', tier: 2, amount: [20000, 50000], seasons: [1, 2],
    perk: l('uśmiech na billboardzie przy obwodnicy', 'a smile on a billboard by the ring road'),
  },
  {
    id: 'spring_water', name: 'Woda Źródlana Zdrojowa', category: 'main', tier: 2, amount: [25000, 60000], seasons: [1, 3],
    perk: l('butelka zawsze etykietą do kamery', 'the bottle always label-to-camera'),
  },
  {
    id: 'kortline', name: 'Kort-Line Odzież', category: 'apparel', tier: 2, amount: [15000, 40000], seasons: [2, 3],
    perk: l('kolekcja „Mistrz Mazowsza”', 'the “Masovian Champion” collection'),
  },
  {
    id: 'thermal', name: 'Termy Białe Wody', category: 'lifestyle', tier: 2, amount: [10000, 30000], seasons: [1, 2],
    perk: l('regeneracja w basenach termalnych', 'recovery in thermal pools'),
  },
  // Tier 3 — national
  {
    id: 'fuel', name: 'Paliwa Wisła', category: 'main', tier: 3, amount: [120000, 350000], seasons: [2, 3],
    perk: l('stacja benzynowa z twoim nazwiskiem przy A2', 'a petrol station named after you on the A2'),
    condition: { kind: 'rank_top', value: 100 }, proOnly: true,
  },
  {
    id: 'telecom', name: 'Telekom Plus', category: 'main', tier: 3, amount: [80000, 220000], seasons: [1, 3],
    perk: l('reklama z psem w roli głównej', 'a TV ad starring a dog'),
  },
  {
    id: 'stork_air', name: 'Linie Lotnicze Bocian', category: 'lifestyle', tier: 3, amount: [60000, 150000], seasons: [1, 2],
    perk: l('loty w klasie biznes na każdy turniej', 'business class flights to every event'),
  },
  {
    id: 'strzala', name: 'Strzała Pro', category: 'racket', tier: 3, amount: [50000, 140000], seasons: [2, 3],
    perk: l('rakieta sygnowana twoim podpisem', 'a racket with your signature'),
  },
  {
    id: 'novi', name: 'Novi Sport', category: 'apparel', tier: 3, amount: [70000, 180000], seasons: [2, 3],
    perk: l('własna linia koszulek polo', 'your own polo shirt line'),
  },
  // Tier 4 — global
  {
    id: 'aurelion', name: 'Aurelion Watches', category: 'lifestyle', tier: 4, amount: [1_200_000, 4_000_000], seasons: [2, 3],
    perk: l('zegarek na nadgarstku przy podnoszeniu trofeum', 'the watch on your wrist when lifting the trophy'),
    condition: { kind: 'rank_top', value: 20 }, proOnly: true,
  },
  {
    id: 'kinetic', name: 'Kinetic Apparel', category: 'apparel', tier: 4, amount: [900_000, 3_500_000], seasons: [3, 3],
    perk: l('globalna kampania z twoją twarzą', 'a global campaign with your face'),
    proOnly: true,
  },
  {
    id: 'vortex', name: 'Vortex Rackets', category: 'racket', tier: 4, amount: [600_000, 2_000_000], seasons: [2, 3],
    perk: l('prototypy rakiet przed premierą', 'prototype rackets before launch'),
    proOnly: true,
  },
  {
    id: 'solaris', name: 'Solaris Motors', category: 'main', tier: 4, amount: [1_500_000, 5_000_000], seasons: [2, 3],
    perk: l('samochód z kierowcą na każdym turnieju', 'a chauffeured car at every tournament'),
    condition: { kind: 'rank_top', value: 30 }, proOnly: true,
  },
  {
    id: 'meridian', name: 'Meridian Private Bank', category: 'main', tier: 4, amount: [1_000_000, 3_000_000], seasons: [1, 3],
    perk: l('kolacje z klientami VIP w Monako', 'dinners with VIP clients in Monaco'),
    condition: { kind: 'rank_top', value: 50 }, proOnly: true,
  },
];

export const SPONSOR_CATEGORY_NAME: Record<SponsorCategory, L> = {
  apparel: l('Odzież', 'Apparel'),
  racket: l('Rakiety', 'Rackets'),
  main: l('Główny', 'Main'),
  lifestyle: l('Lifestyle', 'Lifestyle'),
};
