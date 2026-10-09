import { l, type L } from '../i18n';
import type { BackgroundId, CoachId, DifficultyId } from '../model/types';

export interface BackgroundDef {
  id: BackgroundId;
  name: L;
  description: L;
  potential: [number, number];
  budget: number;
  media: number;
  skillBonus: number;
  coach: CoachId;
  /** Legacy multiplier; null = unranked. */
  multiplier: number | null;
  intro: L;
}

export const BACKGROUNDS: Record<BackgroundId, BackgroundDef> = {
  wall: {
    id: 'wall',
    name: l('Ściana za blokiem', 'The wall behind the block'),
    description: l('Talent losowy, w portfelu pusto.', 'Random talent, empty wallet.'),
    potential: [48, 91],
    budget: 15_000,
    media: 5,
    skillBonus: 0,
    coach: 'dad',
    multiplier: 1.0,
    intro: l(
      'Masz 8 lat. Za blokiem jest ściana garażu, na której ktoś namalował kredą siatkę. Tata znalazł w piwnicy rakietę z drewnianą rączką i powiedział, że „za jego czasów to się grało”. Mama mówi, że to tylko hobby.',
      "You're 8. Behind the block there's a garage wall with a net drawn in chalk. Dad found an old racket in the basement and said “back in my day, we really played”. Mum says it's just a hobby.",
    ),
  },
  sponsor_kid: {
    id: 'sponsor_kid',
    name: l('Dziecko prezesa', "The CEO's kid"),
    description: l(
      'Pieniądze i kamery są, talent jak wypadnie.',
      'Money and cameras are there, talent — we will see.',
    ),
    potential: [45, 87],
    budget: 120_000,
    media: 20,
    skillBonus: 0,
    coach: 'club',
    multiplier: 1.0,
    intro: l(
      'Masz 8 lat. Tata prowadzi firmę, która ma logo na bandach w całym województwie. Na urodziny dostałeś rakietę z autografem i trenera na wyłączność. Lokalna telewizja już raz przyjechała na trening.',
      "You're 8. Dad runs a company whose logo is on every advertising board in the region. For your birthday you got a signed racket and a private coach. Local TV has already filmed one practice.",
    ),
  },
  academy: {
    id: 'academy',
    name: l('Talent z akademii', 'Academy prodigy'),
    description: l(
      'Talent ponad przeciętną, pieniędzy tyle, co trzeba.',
      'Above-average talent, just enough money.',
    ),
    potential: [68, 88],
    budget: 40_000,
    media: 10,
    skillBonus: 5,
    coach: 'club',
    multiplier: 0.6,
    intro: l(
      'Masz 8 lat. Trener z klubu mówi rodzicom, że takiego czucia piłki nie widział od dwudziestu lat. Dostajesz miejsce w grupie naborowej i darmowe korty dwa razy w tygodniu.',
      "You're 8. The club coach tells your parents he hasn't seen such feel for the ball in twenty years. You get a spot in the selection group and free court time twice a week.",
    ),
  },
  chosen: {
    id: 'chosen',
    name: l('Wybraniec', 'The Chosen One'),
    description: l(
      'Talent nie z tej ziemi — tytuły przychodzą same.',
      'Otherworldly talent — titles come by themselves.',
    ),
    potential: [97, 99],
    budget: 80_000,
    media: 15,
    skillBonus: 6,
    coach: 'licensed',
    multiplier: null,
    intro: l(
      'Masz 8 lat i ogrywasz czternastolatków. Trenerzy przyjeżdżają z innych miast, żeby popatrzeć, jak serwujesz. Ktoś już zapisał twoje nazwisko w notesie z napisem „Wimbledon”.',
      "You're 8 and beating fourteen-year-olds. Coaches drive in from other cities just to watch you serve. Someone has already written your name in a notebook labelled “Wimbledon”.",
    ),
  },
};

export interface DifficultyDef {
  id: DifficultyId;
  name: L;
  description: L;
  multiplier: number;
  sponsorFactor: number;
  costFactor: number;
  injuryFactor: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyDef> = {
  normal: {
    id: 'normal',
    name: l('Normalny', 'Normal'),
    description: l('Klasyczne doświadczenie', 'The classic experience'),
    multiplier: 1.0,
    sponsorFactor: 1.0,
    costFactor: 1.0,
    injuryFactor: 1.0,
  },
  hard: {
    id: 'hard',
    name: l('Trudny', 'Hard'),
    description: l('Sponsorzy skąpi, ryzyko wyższe', 'Stingy sponsors, higher risk'),
    multiplier: 1.1,
    sponsorFactor: 0.7,
    costFactor: 1.2,
    injuryFactor: 1.3,
  },
};

export const FAMILY_SUPPORT: Record<0 | 1 | 2, { amount: number; label: L }> = {
  0: { amount: 0, label: l('Rodzina nie dołoży ani złotówki', 'Family cannot add a single zloty') },
  1: { amount: 12_000, label: l('Rodzina dokłada skromnie', 'Family chips in a little') },
  2: { amount: 30_000, label: l('Rodzina ma solidne zaplecze', 'Family has solid backing') },
};
