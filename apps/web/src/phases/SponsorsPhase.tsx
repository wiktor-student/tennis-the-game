import { SPONSOR_CATEGORY_NAME, type CareerState } from '@ttg/engine';
import { useState } from 'react';
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

  const toggle = (id: string, category: string) => {
    setAccepted((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // One contract per category.
      const sameCategory = offers.filter((o) => o.category === category).map((o) => o.id);
      return [...prev.filter((x) => !sameCategory.includes(x)), id];
    });
  };

  return (
    <div className="panel panel--court stack">
      <h2 className="phase-title">{t('phase.sponsors')}</h2>

      {state.sponsors.length > 0 && (
        <ul className="sponsor-list">
          {state.sponsors.map((s) => (
            <li key={s.id} className="sponsor sponsor--active">
              <span className="sponsor__logo">{s.name.slice(0, 2)}</span>
              <div>
                <strong>{s.name}</strong>
                <span className="muted"> · {SPONSOR_CATEGORY_NAME[s.category][locale]}</span>
                <p className="muted sponsor__perk">{c(s.perk)}</p>
              </div>
              <span className="num">
                {money(s.amount, locale)}
                <small className="muted"> · {t('phase.seasons', { n: s.seasonsLeft })}</small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {offers.length === 0 ? (
        <p className="muted serif">{t('phase.sponsorsNone')}</p>
      ) : (
        <ul className="sponsor-list">
          {offers.map((o) => {
            const on = accepted.includes(o.id);
            return (
              <li key={o.id}>
                <button className="sponsor" aria-pressed={on} onClick={() => toggle(o.id, o.category)}>
                  <span className="sponsor__logo">{o.name.slice(0, 2)}</span>
                  <div>
                    <strong>{o.name}</strong>
                    <span className="muted"> · {SPONSOR_CATEGORY_NAME[o.category][locale]}</span>
                    <p className="muted sponsor__perk">{c(o.perk)}</p>
                    {o.condition && <p className="sponsor__cond">{t('phase.condition', { n: o.condition.value })}</p>}
                  </div>
                  <span className="num sponsor__amount">
                    {money(o.amount, locale)}
                    <small className="muted"> /{t('phase.seasons', { n: o.seasons })}</small>
                    <span className={`chip ${on ? 'chip--ball' : ''}`}>{on ? t('phase.signed') : t('phase.accept')}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button className="btn btn--primary btn--block" onClick={() => dispatch({ t: 'sponsors', accept: accepted })}>
        {t('phase.next')}
      </button>
    </div>
  );
}
