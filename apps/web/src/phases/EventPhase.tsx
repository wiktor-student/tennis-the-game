import { EVENTS_BY_ID, type CareerState } from '@ttg/engine';
import { Marks } from '../components/Badges';
import { useContent, useT } from '../i18n';
import { effectChips } from '../lib/effects';
import { money, pct } from '../lib/format';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

/** Offseason events arrive as letters, in-season ones as messages on the phone. */
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
  const phone = pending.context === 'midseason';

  return (
    <div className={`stack event ${phone ? 'event--phone' : 'event--letter'}`}>
      <p className="label">{phone ? t('event.midseason') : t('event.offseason')}</p>
      <div className={phone ? 'phone' : 'card card--clean letter'}>
        {!phone && <span className="tape tape--top tape--pink" />}
        <p className={phone ? 'bubble bubble--in' : 'lead'}>{c(event.text, gender, vars)}</p>
        {resolved && chosen && phone && (
          <p className="bubble bubble--out">{c(chosen.label, gender, vars)}</p>
        )}
      </div>

      {!resolved && (
        <div className="replies">
          <p className="label">{t('event.reply')}</p>
          {event.options.map((opt, i) => {
            const chance = pending.chances[i];
            const affordable = opt.cost === undefined || state.finance.budget >= opt.cost;
            const preview = effectChips(opt.effects, locale);
            return (
              <button
                key={i}
                className="pick reply"
                disabled={!affordable}
                onClick={() => dispatch({ t: 'choose', option: i })}
              >
                <span className="pick__title">{c(opt.label, gender, vars)}</span>
                <span className="reply__meta">
                  {chance !== null && chance !== undefined && (
                    <span className="tag">{t('event.chance', { p: pct(chance) })}</span>
                  )}
                  {opt.cost !== undefined && (
                    <span className="tag">
                      {t('event.cost', { amount: money(opt.cost, locale) })}
                    </span>
                  )}
                  <span className="pencil">
                    {preview.map((p) => p.text).join(' · ')}
                    {opt.hint ? `${preview.length ? ' — ' : ''}${c(opt.hint, gender)}` : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {resolved && chosen && (
        <div className="aftermath">
          <p className="hand aftermath__text">
            {c(
              resolved.success === false ? (chosen.failResult ?? chosen.result) : chosen.result,
              gender,
              vars,
            )}
          </p>
          <Marks chips={effectChips(resolved.effects, locale)} />
          <button className="btn btn--ink btn--block" onClick={() => dispatch({ t: 'continue' })}>
            {t('event.next')}
          </button>
        </div>
      )}
    </div>
  );
}
