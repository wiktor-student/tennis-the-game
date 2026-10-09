import { COACHES, SKILL_INFO, type EffectTarget, type L } from '@ttg/engine';
import type { Locale } from '../store/settings';
import { money, signed } from './format';

export interface EffectChip {
  text: string;
  tone: 'up' | 'down' | 'neutral';
}

const t = (l: L, locale: Locale) => l[locale];

const SURFACE: Record<string, L> = {
  clay: { pl: 'Mączka', en: 'Clay' },
  grass: { pl: 'Trawa', en: 'Grass' },
  hard: { pl: 'Twarda', en: 'Hard' },
};

/** Human-readable summary of story/decision effects, e.g. "Psychika +2", "-4 tys. zł". */
export function effectChips(effects: EffectTarget[], locale: Locale): EffectChip[] {
  const pl = locale === 'pl';
  const chips: EffectChip[] = [];
  for (const e of effects) {
    switch (e.kind) {
      case 'skill':
        chips.push({ text: `${t(SKILL_INFO[e.skill].short, locale)} ${signed(e.delta, e.delta % 1 ? 1 : 0)}`, tone: e.delta >= 0 ? 'up' : 'down' });
        break;
      case 'potential':
        chips.push({ text: pl ? 'Potencjał ↑' : 'Potential ↑', tone: 'up' });
        break;
      case 'budget':
        chips.push({ text: `${e.delta > 0 ? '+' : ''}${money(e.delta, locale)}`, tone: e.delta >= 0 ? 'up' : 'down' });
        break;
      case 'media':
        chips.push({ text: `Media ${signed(e.delta)}`, tone: e.delta >= 0 ? 'up' : 'down' });
        break;
      case 'reputation':
        chips.push({ text: `${pl ? 'Reputacja' : 'Reputation'} ${signed(e.delta)}`, tone: e.delta >= 0 ? 'up' : 'down' });
        break;
      case 'morale':
        chips.push({ text: `Morale ${signed(e.delta)}`, tone: e.delta >= 0 ? 'up' : 'down' });
        break;
      case 'fatigue':
        chips.push({ text: `${pl ? 'Zmęczenie' : 'Fatigue'} ${signed(e.delta)}`, tone: e.delta <= 0 ? 'up' : 'down' });
        break;
      case 'surface':
        chips.push({ text: `${t(SURFACE[e.surface] as L, locale)} ${signed(e.delta)}`, tone: 'up' });
        break;
      case 'injury':
        chips.push({ text: pl ? `Kontuzja ${e.weeks} tyg.` : `Injury ${e.weeks} wk`, tone: 'down' });
        break;
      case 'coach':
        chips.push({ text: `${pl ? 'Trener' : 'Coach'}: ${t(COACHES[e.coach].name, locale)}`, tone: 'neutral' });
        break;
      case 'davis_cup':
        chips.push({ text: pl ? 'Tytuł drużynowy!' : 'Team title!', tone: 'up' });
        break;
      case 'turn_pro':
        chips.push({ text: pl ? 'Zawodowstwo' : 'Turning pro', tone: 'neutral' });
        break;
      case 'exempt':
        chips.push({ text: `Junior exempt ×${e.count}`, tone: 'up' });
        break;
      case 'reveal_height':
      case 'flag':
      case 'promote':
      case 'retire_forced':
        break;
    }
  }
  return chips;
}
