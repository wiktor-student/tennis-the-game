import type { Rng } from '../rng';
import type { Gender } from '../model/types';

/** Fictional name pools. Any resemblance to real players is coincidental. */

const PL_MALE = [
  'Adam', 'Antoni', 'Bartosz', 'Borys', 'Cezary', 'Damian', 'Dawid', 'Dominik', 'Filip',
  'Franciszek', 'Gabriel', 'Hubert', 'Igor', 'Ignacy', 'Jakub', 'Jan', 'Jędrzej', 'Kacper',
  'Karol', 'Kamil', 'Konrad', 'Krystian', 'Leon', 'Maciej', 'Marcel', 'Mateusz', 'Michał',
  'Mikołaj', 'Miłosz', 'Nikodem', 'Olaf', 'Oliwer', 'Oskar', 'Patryk', 'Piotr', 'Przemysław',
  'Remigiusz', 'Seweryn', 'Stanisław', 'Szymon', 'Tadeusz', 'Tymon', 'Tymoteusz', 'Wiktor',
  'Witold', 'Wojciech', 'Zbigniew', 'Ksawery', 'Aleksander', 'Bruno',
];

const PL_FEMALE = [
  'Ada', 'Agata', 'Aleksandra', 'Alicja', 'Amelia', 'Anna', 'Antonina', 'Barbara', 'Blanka',
  'Dominika', 'Emilia', 'Ewa', 'Gabriela', 'Hanna', 'Helena', 'Iga', 'Inga', 'Julia', 'Jagoda',
  'Joanna', 'Kalina', 'Karolina', 'Katarzyna', 'Klara', 'Kornelia', 'Laura', 'Lena', 'Liliana',
  'Magdalena', 'Maja', 'Malwina', 'Marcelina', 'Maria', 'Marta', 'Martyna', 'Milena', 'Natalia',
  'Nikola', 'Oliwia', 'Paulina', 'Pola', 'Roksana', 'Róża', 'Sara', 'Tamara', 'Urszula',
  'Weronika', 'Wiktoria', 'Zofia', 'Zuzanna',
];

/** Masculine surname forms; feminine forms derived by `feminize`. */
const PL_SURNAMES = [
  'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski',
  'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur',
  'Kwiatkowski', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Nowakowski', 'Pawłowski', 'Michalski',
  'Adamczyk', 'Dudek', 'Zając', 'Wieczorek', 'Jabłoński', 'Król', 'Majewski', 'Olszewski',
  'Jaworski', 'Wróbel', 'Malinowski', 'Pawlak', 'Witkowski', 'Walczak', 'Stępień', 'Górski',
  'Rutkowski', 'Michalak', 'Sikora', 'Ostrowski', 'Baran', 'Duda', 'Szewczyk', 'Tomaszewski',
  'Pietrzak', 'Marciniak', 'Wróblewski', 'Zalewski', 'Jakubowski', 'Jasiński', 'Zawadzki',
  'Sadowski', 'Bąk', 'Chmielewski', 'Włodarczyk', 'Borkowski', 'Czarnecki', 'Sawicki',
  'Sokołowski', 'Urbański', 'Kubiak', 'Maciejewski', 'Szczepański', 'Kucharski', 'Wilk',
  'Kalinowski', 'Lis', 'Mazurek', 'Wysocki', 'Adamski', 'Kaźmierczak', 'Wasilewski',
  'Sobczak', 'Czerwiński', 'Andrzejewski', 'Cieślak', 'Głowacki', 'Zakrzewski', 'Kołodziej',
  'Sikorski', 'Krajewski', 'Gajewski', 'Szymczak', 'Szulc', 'Baranowski', 'Laskowski',
  'Brzeziński', 'Makowski', 'Ziółkowski', 'Przybylski', 'Domański', 'Nowicki', 'Borowski',
  'Błaszczyk', 'Chojnacki', 'Ciesielski', 'Mróz', 'Szczepaniak', 'Wesołowski', 'Górecki',
  'Krupa', 'Kaczmarczyk', 'Leśniak', 'Kozieł', 'Pająk', 'Rybak', 'Gołębiowski', 'Żak',
];

export function feminize(surname: string): string {
  if (surname.endsWith('ski')) return `${surname.slice(0, -1)}a`;
  if (surname.endsWith('cki')) return `${surname.slice(0, -1)}a`;
  if (surname.endsWith('dzki')) return `${surname.slice(0, -1)}a`;
  return surname;
}

interface NationPool {
  nat: string;
  weight: number;
  male: string[];
  female: string[];
  surnames: string[];
}

const NATIONS: NationPool[] = [
  {
    nat: 'ES', weight: 9,
    male: ['Álvaro', 'Pablo', 'Javier', 'Diego', 'Sergio', 'Hugo', 'Marcos', 'Iker', 'Rubén', 'Adrián'],
    female: ['Lucía', 'Paula', 'Carla', 'Marta', 'Nerea', 'Irene', 'Alba', 'Sara', 'Noelia', 'Elena'],
    surnames: ['Ferrer', 'Navarro', 'Ortega', 'Domínguez', 'Vidal', 'Morales', 'Castaño', 'Serrano', 'Molina', 'Cabrera', 'Rubio', 'Prieto'],
  },
  {
    nat: 'FR', weight: 8,
    male: ['Lucas', 'Hugo', 'Théo', 'Mathis', 'Arthur', 'Enzo', 'Clément', 'Baptiste', 'Quentin', 'Louis'],
    female: ['Chloé', 'Manon', 'Léa', 'Camille', 'Inès', 'Clara', 'Océane', 'Margaux', 'Elise', 'Jade'],
    surnames: ['Lefèvre', 'Moreau', 'Girard', 'Fontaine', 'Rousseau', 'Chevalier', 'Bonnet', 'Mercier', 'Lambert', 'Garnier', 'Faure', 'Dufour'],
  },
  {
    nat: 'IT', weight: 8,
    male: ['Lorenzo', 'Matteo', 'Andrea', 'Federico', 'Tommaso', 'Riccardo', 'Gabriele', 'Pietro', 'Edoardo', 'Luca'],
    female: ['Giulia', 'Chiara', 'Martina', 'Sofia', 'Aurora', 'Elisa', 'Bianca', 'Ginevra', 'Alessia', 'Noemi'],
    surnames: ['Rinaldi', 'Ferraro', 'Colombo', 'Mancini', 'Galli', 'Bellini', 'Fontana', 'Moretti', 'Lombardi', 'Barbieri', 'Caruso', 'Marchetti'],
  },
  {
    nat: 'DE', weight: 6,
    male: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Leon', 'Niklas', 'Moritz', 'Tim', 'Florian', 'Jannik'],
    female: ['Lena', 'Hannah', 'Laura', 'Lea', 'Johanna', 'Anna', 'Mia', 'Clara', 'Emilia', 'Paula'],
    surnames: ['Brandt', 'Hartmann', 'Krüger', 'Lehmann', 'Vogel', 'Schäfer', 'Wolff', 'Neumann', 'Zimmer', 'Kessler', 'Baumann', 'Reuter'],
  },
  {
    nat: 'US', weight: 9,
    male: ['Tyler', 'Brandon', 'Ethan', 'Logan', 'Mason', 'Caleb', 'Hunter', 'Ryan', 'Jack', 'Nolan'],
    female: ['Madison', 'Taylor', 'Peyton', 'Avery', 'Brooke', 'Hailey', 'Morgan', 'Kayla', 'Riley', 'Sydney'],
    surnames: ['Walker', 'Bennett', 'Coleman', 'Hayes', 'Parker', 'Brooks', 'Sullivan', 'Reed', 'Fisher', 'Porter', 'Hudson', 'Carter'],
  },
  {
    nat: 'AU', weight: 4,
    male: ['Lachlan', 'Cooper', 'Riley', 'Harrison', 'Liam', 'Jai', 'Archie', 'Blake'],
    female: ['Isla', 'Matilda', 'Ruby', 'Zara', 'Georgia', 'Holly', 'Tahlia', 'Ella'],
    surnames: ['Kelly', 'McKenzie', 'Fraser', 'Gibson', 'Harper', 'Doyle', 'Whitlock', 'Bryce'],
  },
  {
    nat: 'GB', weight: 5,
    male: ['Oliver', 'Harry', 'George', 'Alfie', 'Charlie', 'Jamie', 'Callum', 'Rhys'],
    female: ['Amelia', 'Freya', 'Poppy', 'Imogen', 'Harriet', 'Eleanor', 'Katie', 'Lily'],
    surnames: ['Ashworth', 'Pemberton', 'Fletcher', 'Hollis', 'Wainwright', 'Spencer', 'Barlow', 'Lockwood'],
  },
  {
    nat: 'CZ', weight: 5,
    male: ['Jakub', 'Tomáš', 'Vojtěch', 'Ondřej', 'Matěj', 'Adam', 'Dominik', 'Filip'],
    female: ['Tereza', 'Kateřina', 'Barbora', 'Eliška', 'Adéla', 'Markéta', 'Linda', 'Nikola'],
    surnames: ['Novotný', 'Dvořák', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný'],
  },
  {
    nat: 'RS', weight: 3,
    male: ['Luka', 'Stefan', 'Nikola', 'Marko', 'Miloš', 'Uroš'],
    female: ['Jelena', 'Milica', 'Ana', 'Teodora', 'Katarina', 'Nina'],
    surnames: ['Petrović', 'Jovanović', 'Marković', 'Ilić', 'Stanković', 'Lazarević', 'Đorđević'],
  },
  {
    nat: 'AR', weight: 4,
    male: ['Facundo', 'Tomás', 'Juan Manuel', 'Santiago', 'Nicolás', 'Mariano'],
    female: ['Valentina', 'Camila', 'Florencia', 'Agustina', 'Julieta', 'Micaela'],
    surnames: ['Bustos', 'Echeverría', 'Ledesma', 'Quiroga', 'Sosa', 'Benítez', 'Villalba'],
  },
  {
    nat: 'JP', weight: 3,
    male: ['Haruto', 'Ren', 'Sota', 'Yuto', 'Kaito', 'Riku'],
    female: ['Yui', 'Hina', 'Sakura', 'Aoi', 'Mio', 'Rin'],
    surnames: ['Takahashi', 'Nakamura', 'Kobayashi', 'Yamada', 'Matsuda', 'Ishikawa'],
  },
  {
    nat: 'CA', weight: 3,
    male: ['Félix', 'Gabriel', 'Owen', 'Xavier', 'Mathieu', 'Dylan'],
    female: ['Leylah', 'Rebecca', 'Bianca', 'Maude', 'Gabrielle', 'Kayla'],
    surnames: ['Tremblay', 'Gagnon', 'Bouchard', 'Lavoie', 'Côté', 'Pelletier'],
  },
  {
    nat: 'CH', weight: 2,
    male: ['Dominic', 'Leandro', 'Jérôme', 'Marc-Andrea'],
    female: ['Belinda', 'Viktorija', 'Céline', 'Simona'],
    surnames: ['Brunner', 'Keller', 'Meier', 'Huber', 'Steiner'],
  },
  {
    nat: 'NL', weight: 2,
    male: ['Tallon', 'Daan', 'Sem', 'Jesper'],
    female: ['Suzan', 'Arantxa', 'Demi', 'Noor'],
    surnames: ['de Vries', 'van Dijk', 'Bakker', 'Visser', 'Jansen'],
  },
  {
    nat: 'UA', weight: 3,
    male: ['Oleksandr', 'Vitaliy', 'Illya', 'Bohdan'],
    female: ['Dayana', 'Marta', 'Kateryna', 'Anhelina', 'Yuliia'],
    surnames: ['Shevchenko', 'Bondarenko', 'Kravets', 'Melnyk', 'Tkachenko'],
  },
  {
    nat: 'BR', weight: 3,
    male: ['João', 'Thiago', 'Gustavo', 'Felipe', 'Rafael'],
    female: ['Beatriz', 'Laura', 'Luisa', 'Carolina', 'Gabriela'],
    surnames: ['Souza', 'Monteiro', 'Barbosa', 'Rocha', 'Teixeira'],
  },
  {
    nat: 'CN', weight: 3,
    male: ['Zhizhen', 'Yibing', 'Juncheng', 'Hao'],
    female: ['Qinwen', 'Xinyu', 'Lin', 'Yue', 'Shuai'],
    surnames: ['Wang', 'Zhang', 'Li', 'Chen', 'Liu', 'Zhou'],
  },
  {
    nat: 'KZ', weight: 2,
    male: ['Alexander', 'Dmitry', 'Timofey'],
    female: ['Elena', 'Yulia', 'Anna'],
    surnames: ['Bublikov', 'Rybakov', 'Kukushkin', 'Putintsev'],
  },
  {
    nat: 'HR', weight: 2,
    male: ['Borna', 'Dino', 'Mate'],
    female: ['Donna', 'Petra', 'Ana'],
    surnames: ['Horvat', 'Kovačić', 'Babić', 'Marić'],
  },
  {
    nat: 'NO', weight: 1,
    male: ['Casper', 'Viktor', 'Nicolai'],
    female: ['Ulrikke', 'Malene', 'Ingrid'],
    surnames: ['Haugen', 'Lunde', 'Berg', 'Dahl'],
  },
];

export interface GeneratedName {
  first: string;
  last: string;
  nat: string;
}

export function polishName(rng: Rng, gender: Gender): GeneratedName {
  const first = rng.pick(gender === 'M' ? PL_MALE : PL_FEMALE);
  const surname = rng.pick(PL_SURNAMES);
  return { first, last: gender === 'M' ? surname : feminize(surname), nat: 'PL' };
}

export function foreignName(rng: Rng, gender: Gender): GeneratedName {
  const nation = rng.weighted(NATIONS, (n) => n.weight);
  return {
    first: rng.pick(gender === 'M' ? nation.male : nation.female),
    last: rng.pick(nation.surnames),
    nat: nation.nat,
  };
}

/** International mix with a configurable share of Polish players. */
export function mixedName(rng: Rng, gender: Gender, polishShare: number): GeneratedName {
  return rng.chance(polishShare) ? polishName(rng, gender) : foreignName(rng, gender);
}

export const NATION_CODES = ['PL', ...NATIONS.map((n) => n.nat)];
