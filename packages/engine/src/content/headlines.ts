import { l, type L } from '../i18n';

/** Fictional newspapers. */
export const OUTLETS = [
  'Przegląd Kortowy',
  'Gazeta Tenisowa',
  'Tygodnik Return',
  'Sport Wieczorem',
];

/**
 * Season-end headlines. Vars: {name}, {last}, {event}, {rank}, {titles}, {outlet}.
 */
export const HEADLINES: Record<string, L> = {
  slam_title: l(
    '„{last} [[królem|królową]] świata!” — {name} wygrywa {event}',
    '“{last} on top of the world!” — {name} wins {event}',
  ),
  year_end_no1: l(
    'Polski numer jeden na koniec roku. {name} kończy sezon na szczycie',
    'Polish year-end No. 1. {name} finishes the season on top',
  ),
  finals_title: l(
    '[[Mistrz|Mistrzyni]] Finałów! {name} zamyka sezon tytułem w {event}',
    'Finals champion! {name} closes the season with the {event} title',
  ),
  big_title: l(
    '{name} zdobywa {event}. „To dopiero początek”',
    '{name} wins {event}. “This is only the beginning”',
  ),
  top10: l(
    '{name} w pierwszej dziesiątce świata. Pozycja nr {rank}',
    '{name} in the world top ten. Ranked No. {rank}',
  ),
  top100: l(
    'Witamy w setce! {name} kończy rok na {rank}. miejscu',
    'Welcome to the top 100! {name} ends the year at No. {rank}',
  ),
  pro_title: l(
    'Pierwszy zawodowy puchar: {name} triumfuje w {event}',
    'First pro trophy: {name} triumphs in {event}',
  ),
  titles: l(
    '{titles} tytuły w sezonie. {name} coraz wyżej',
    '{titles} titles this season. {name} keeps climbing',
  ),
  junior_slam: l(
    'Juniorski {event} dla Polski! {name} z tytułem',
    'Junior {event} goes to Poland! {name} takes the title',
  ),
  junior_no1: l(
    '{name} [[najlepszym juniorem|najlepszą juniorką]] świata',
    '{name} is the best junior in the world',
  ),
  polish_champ: l(
    '{name} [[mistrzem|mistrzynią]] Polski! Talent rośnie',
    '{name} is Polish champion! The talent keeps growing',
  ),
  junior_top: l(
    '{name} w czołówce klasyfikacji. Miejsce {rank}',
    '{name} near the top of the standings. Ranked {rank}',
  ),
  quiet: l(
    'Rok pracy u podstaw. {name} na {rank}. miejscu',
    'A year of groundwork. {name} ranked {rank}',
  ),
  struggle: l(
    'Trudny sezon dla {name}. Kibice czekają na przełom',
    'A tough season for {name}. Fans await the breakthrough',
  ),
  injury: l(
    'Kontuzje zatrzymały {name}. „Wrócę [[silniejszy|silniejsza]]”',
    'Injuries stopped {name}. “I will come back stronger”',
  ),
};
