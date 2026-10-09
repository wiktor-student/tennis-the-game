import type { Locale } from '../store/settings';

/** Money in the game's own style: "28 tys. zł", "3,4 mln zł" / "28k zł", "3.4m zł". */
export function money(amount: number, locale: Locale, withUnit = true): string {
  const sign = amount < 0 && Math.abs(amount) >= 0.5 ? '-' : '';
  const abs = Math.abs(amount);
  const unit = withUnit ? ' zł' : '';
  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
      maximumFractionDigits: abs >= 10_000_000 ? 0 : 1,
    });
    return `${sign}${v}${locale === 'pl' ? ' mln' : 'm'}${unit}`;
  }
  if (abs >= 1000) {
    const v = Math.round(abs / 1000);
    return `${sign}${v}${locale === 'pl' ? ' tys.' : 'k'}${unit}`;
  }
  return `${sign}${Math.round(abs)}${unit}`;
}

export function signed(n: number, digits = 0): string {
  const v = digits ? n.toFixed(digits) : String(Math.round(n));
  return n > 0 ? `+${v}` : v;
}

export function rank(r: number | null): string {
  return r === null ? '—' : `#${r}`;
}

export function pct(p: number): number {
  return Math.round(p * 100);
}

export function timeLeft(seconds: number): { d: number; h: number; m: number } {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return { d, h, m };
}
