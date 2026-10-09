import { fill, genderize, type L } from '@ttg/engine';
import { useCallback } from 'react';
import { useSettings, type Locale } from '../store/settings';
import { en, pl, type MessageKey } from './dictionary';

const DICTS: Record<Locale, Record<MessageKey, string>> = { pl, en };

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const text = DICTS[locale][key] ?? pl[key] ?? key;
  return vars ? fill(text, vars) : text;
}

export function useT(): Translate {
  const locale = useSettings((s) => s.locale);
  return useCallback((key, vars) => translate(locale, key, vars), [locale]);
}

/** Render engine content text: locale → [[m|f]] markers → {vars}. */
export function useContent(): (
  text: L,
  gender?: 'M' | 'F',
  vars?: Record<string, string | number>,
) => string {
  const locale = useSettings((s) => s.locale);
  return useCallback(
    (text, gender = 'M', vars) => fill(genderize(text[locale] ?? text.pl, gender), vars ?? {}),
    [locale],
  );
}

/** Translate and resolve [[m|f]] markers for the career's gender. */
export function useTg(): (
  key: MessageKey,
  gender: 'M' | 'F',
  vars?: Record<string, string | number>,
) => string {
  const t = useT();
  return useCallback((key, gender, vars) => genderize(t(key, vars), gender), [t]);
}

export type { MessageKey };
