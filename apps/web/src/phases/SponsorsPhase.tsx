import { SPONSOR_CATEGORY_NAME, type CareerState } from '@ttg/engine';
import { useState } from 'react';
import { Signature } from '../components/Signature';
import { useContent, useT } from '../i18n';
import { money } from '../lib/format';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function SponsorsPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const offers = state.phase.kind === 'sponsors' ? state.phase.offers : [];
  const [accepted, setAccepted] = useState<string[]>([]);
  const signature = `${state.player.first.charAt(0)}. ${state.player.last}`;

  const toggle = (id: string, category: string) =>
    setAccepted((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const same = offers.filter((o) => o.category === category).map((o) => o.id);
      return [...prev.filter((x) => !same.includes(x)), id];
    });

  return (
    <div className="stack">
      <h2 className="title">{t('sponsors.title')}</h2>
      <p>{t('sponsors.lead')}</p>

      {state.sponsors.length > 0 && (
        <p className="pencil">
          {t('sponsors.active')}:{' '}
          {state.sponsors
            .map((s) => `${s.name} (${t('sponsors.seasons', { n: s.seasonsLeft })})`)
            .join(' · ')}
        </p>
      )}

      {offers.length === 0 ? (
        <p className="hand">{t('sponsors.none')}</p>
      ) : (
        <div className="contracts">
          {offers.map((o, i) => {
            const signed = accepted.includes(o.id);
            return (
              <article
                key={o.id}
                className="card card--clean contract"
                style={{ rotate: `${(i % 2 ? 1 : -1) * 0.6}deg` }}
              >
                <span className={`tape ${i % 2 ? 'tape--tr' : 'tape--tl'}`} />
                <p className="label">
                  {SPONSOR_CATEGORY_NAME[o.category][locale]} ·{' '}
                  {t('sponsors.seasons', { n: o.seasons })}
                </p>
                <h3 className="contract__name">{o.name}</h3>
                <p className="contract__amount mono">
                  {money(o.amount, locale)}{' '}
                  <span className="pencil">/ {locale === 'pl' ? 'sezon' : 'season'}</span>
                </p>
                <p className="contract__duty">
                  <span className="label">{t('sponsors.duty')}</span> {c(o.perk)}
                </p>
                {o.condition && (
                  <p className="contract__cond hand">
                    {t('sponsors.condition', { n: o.condition.value })}
                  </p>
                )}
                <div className="contract__sign">
                  <Signature name={signature} signed={signed} />
                  <button
                    className={`btn btn--sm ${signed ? '' : 'btn--hl'}`}
                    onClick={() => toggle(o.id, o.category)}
                  >
                    {signed ? t('sponsors.unsign') : t('sponsors.sign')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <button
        className="btn btn--ink btn--block"
        onClick={() => dispatch({ t: 'sponsors', accept: accepted })}
      >
        {t('sponsors.next')}
      </button>
    </div>
  );
}
