import type { Gender, Outlook } from '@ttg/engine';
import { useTg, type MessageKey } from '../i18n';

/** Pencil-marked odds for a tournament: first-match chance plus a one-word verdict. */
export function OddsTag({ outlook, gender }: { outlook: Outlook; gender: Gender }) {
  const tg = useTg();
  const verdict = tg(`odds.${outlook.verdict}` as MessageKey, gender);
  return (
    <span className={`odds odds--${outlook.verdict}`}>
      {outlook.verdict === 'closed' ? verdict : `${Math.round(outlook.first * 100)}% · ${verdict}`}
    </span>
  );
}
