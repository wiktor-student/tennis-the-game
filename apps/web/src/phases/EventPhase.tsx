import { EVENTS_BY_ID, type CareerState } from '@ttg/engine';
import { Chips } from '../components/Badges';
import { useContent, useT } from '../i18n';
import { effectChips } from '../lib/effects';
import { money, pct } from '../lib/format';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function EventPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  if (state.phase.kind !== 'event') return null;
  const pending = state.phase.event;
  const event = EVENTS_BY_ID[pending.eventId];
  if (!event) return null;
  const gender = state.config.gender;
  const vars = pending.vars;
  const resolved = pending.resolved;
  const chosen = resolved ? event.options[resolved.option] : null;
  const lastInQueue = pending.context === 'offseason' && state.eventQueue.length === 0;

  return (
    <div className="panel panel--court stack event">
      <h2 className="phase-title">{t('phase.event')}</h2>
      <p className="narrative event__text">{c(event.text, gender, vars)}</p>

      {!resolved && (
        <div className="choices">
          {event.options.map((opt, i) => {
            const chance = pending.chances[i];
            const affordable = opt.cost === undefined || state.finance.budget >= opt.cost;
            const preview = effectChips(opt.effects, locale);
            return (
              <button key={i} className="choice" disabled={!affordable} onClick={() => dispatch({ t: 'choose', option: i })}>
                <span className="choice__title">{c(opt.label, gender, vars)}</span>
                {chance !== null && chance !== undefined && <span className="choice__aside num">{t('phase.chance', { p: pct(chance) })}</span>}
                <span className="choice__meta">
                  {preview.map((p) => p.text).join(' · ')}
                  {opt.hint ? `${preview.length ? ', ' : ''}${c(opt.hint, gender)}` : ''}
                  {opt.cost !== undefined && ` · ${t('phase.cost', { amount: money(opt.cost, locale) })}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {resolved && chosen && (
        <>
          <p className="narrative event__result">
            {c(resolved.success === false ? (chosen.failResult ?? chosen.result) : chosen.result, gender, vars)}
          </p>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              {t('phase.effects')}
            </p>
            <Chips chips={effectChips(resolved.effects, locale)} />
          </div>
          <button className="btn btn--primary btn--block" onClick={() => dispatch({ t: 'continue' })}>
            {pending.context === 'midseason' ? t('phase.next') : lastInQueue ? t('phase.next') : t('phase.next')}
          </button>
        </>
      )}
    </div>
  );
}
