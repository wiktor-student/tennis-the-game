import { create } from 'zustand';
import { load, save } from '../lib/storage';

export type Motion = 'full' | 'reduced' | 'none';
export type Speed = 'slow' | 'normal' | 'fast';
export type Locale = 'pl' | 'en';

interface SettingsState {
  locale: Locale;
  motion: Motion;
  speed: Speed;
  racket: string;
  set: (patch: Partial<Pick<SettingsState, 'locale' | 'motion' | 'speed' | 'racket'>>) => void;
}

const initial = load<Partial<SettingsState>>('settings', {});
const prefersReduced =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useSettings = create<SettingsState>((set, get) => ({
  locale:
    initial.locale ??
    (typeof navigator !== 'undefined' && !navigator.language.startsWith('pl') ? 'en' : 'pl'),
  motion: initial.motion ?? (prefersReduced ? 'reduced' : 'full'),
  speed: initial.speed ?? 'normal',
  racket: initial.racket ?? 'classic',
  set: (patch) => {
    set(patch);
    const { locale, motion, speed, racket } = get();
    save('settings', { locale, motion, speed, racket });
  },
}));

/** Milliseconds between auto-simulated tournaments. */
export function simDelay(speed: Speed): number {
  return speed === 'slow' ? 900 : speed === 'fast' ? 120 : 420;
}
