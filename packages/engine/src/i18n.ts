/** Locales supported by game content. UI strings live in the web app. */
export type Locale = 'pl' | 'en';

/** A piece of player-facing content text in every supported locale. */
export interface L {
  pl: string;
  en: string;
}

/** Builds a localized text; the English variant falls back to Polish for proper nouns. */
export function l(pl: string, en?: string): L {
  return { pl, en: en ?? pl };
}

export function tr(text: L, locale: Locale): string {
  return text[locale] ?? text.pl;
}

/**
 * Resolves `[[masculine|feminine]]` markers. Opponents always share the player's tour,
 * so a single gender switch covers the player and every rival in a text.
 */
export function genderize(text: string, gender: 'M' | 'F'): string {
  return text.replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, (_, m: string, f: string) =>
    gender === 'M' ? m : f,
  );
}

/** Simple `{name}` interpolation for content templates. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
