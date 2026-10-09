import { l, type L } from '../i18n';

/** Racket paint jobs — the collectible cosmetic, unlocked by achievements. */
export interface RacketDef {
  id: string;
  name: L;
  frame: string;
  accent: string;
  grip: string;
  /** Achievement required; null = available from the start. */
  unlock: string | null;
}

export const RACKETS: RacketDef[] = [
  { id: 'classic', name: l('Klasyk', 'Classic'), frame: '#E9E4D4', accent: '#1F5135', grip: '#3B2A1E', unlock: null },
  { id: 'garage', name: l('Garażowa', 'Garage'), frame: '#7B7F86', accent: '#C9C3B4', grip: '#2B2B2B', unlock: null },
  { id: 'clay', name: l('Ceglana', 'Brick'), frame: '#C1593A', accent: '#F1E3CF', grip: '#4A2418', unlock: 'first_title' },
  { id: 'national', name: l('Biało-czerwona', 'White & red'), frame: '#F4F1EA', accent: '#C8102E', grip: '#C8102E', unlock: 'polish_champion' },
  { id: 'petit', name: l('Tarbes', 'Tarbes'), frame: '#2C4A8C', accent: '#F2C14E', grip: '#1A2238', unlock: 'petits_as' },
  { id: 'night', name: l('Sesja nocna', 'Night session'), frame: '#14213D', accent: '#7FB7E6', grip: '#0B1020', unlock: 'top100' },
  { id: 'junior_gold', name: l('Junior Gold', 'Junior Gold'), frame: '#1B1B1B', accent: '#D4AF37', grip: '#1B1B1B', unlock: 'junior_slam' },
  { id: 'centre', name: l('Centre Court', 'Centre Court'), frame: '#FFFFFF', accent: '#4B2A6B', grip: '#0E4D2F', unlock: 'wim' },
  { id: 'terre', name: l('Terre battue', 'Terre battue'), frame: '#B5502F', accent: '#F7F3EA', grip: '#1F3B2C', unlock: 'rg' },
  { id: 'flushing', name: l('Flushing', 'Flushing'), frame: '#1D3F8A', accent: '#E8F5FF', grip: '#0A1A3F', unlock: 'uso' },
  { id: 'melbourne', name: l('Melbourne Blue', 'Melbourne Blue'), frame: '#2E7BC4', accent: '#BCE3FF', grip: '#0F2D4F', unlock: 'ao' },
  { id: 'olympic', name: l('Olimpijska', 'Olympic'), frame: '#E8C547', accent: '#1B1B1B', grip: '#6B5418', unlock: 'olympic_medal' },
  { id: 'number_one', name: l('Korona', 'Crown'), frame: '#0E0E0E', accent: '#E3C566', grip: '#E3C566', unlock: 'no1' },
  { id: 'golden', name: l('Złoty Szlem', 'Golden Slam'), frame: '#D4AF37', accent: '#FFF6D5', grip: '#5C4613', unlock: 'golden_slam' },
  { id: 'dad', name: l('Tata wiedział', 'Dad knew'), frame: '#8C5A2B', accent: '#F0D9B5', grip: '#3E2A16', unlock: 'dad_coach' },
];
