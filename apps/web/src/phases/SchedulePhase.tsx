import {
  LEVELS,
  autoPlan,
  equipmentCost,
  projectEntry,
  staffCost,
  tournament,
  travelCost,
  type CareerState,
} from '@ttg/engine';
import { useMemo, useState } from 'react';
import { Stamp } from '../components/Stamp';
import { useContent, useT, type MessageKey } from '../i18n';
import { money, pct } from '../lib/format';
import { monthOf } from '../panels/Panels';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function SchedulePhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const slots = state.season.slots;
  const [plan, setPlan] = useState<(string | null)[]>(state.season.plan);
  const isPro = state.season.stage === 'pro';
  const gender = state.config.gender;

  const blocked = useMemo(() => {
    const set = new Set<number>();
    plan.forEach((id, i) => {
      if (!id) return;
      const def = tournament(id);
      const next = slots[i + 1];
      if (def.span > 1 && next && next.week < def.week + def.span) set.add(i + 1);
    });
    return set;
  }, [plan, slots]);

  const planned = plan.filter((id, i) => id && !blocked.has(i)) as string[];
  const travel = planned.reduce((n, id) => n + travelCost(state, tournament(id)), 0);
  const sponsors = state.sponsors.reduce((n, s) => n + s.amount, 0);
  const after = state.finance.budget - staffCost(state) - equipmentCost(state) + sponsors - travel;
  const setPick = (i: number, id: string | null) =>
    setPlan((p) => p.map((x, j) => (j === i ? id : x)));

  const entryLabel = (id: string) => {
    const e = projectEntry(state, tournament(id));
    return {
      status: e.status,
      text:
        e.status === 'wildcard'
          ? t('entry.wildcard', { p: pct(e.wildcard) })
          : t(`entry.${e.status}` as MessageKey),
    };
  };

  // Pro weeks grouped by month.
  const months = new Map<string, number[]>();
  slots.forEach((slot, i) => {
    const m = monthOf(slot.week, locale);
    months.set(m, [...(months.get(m) ?? []), i]);
  });

  return (
    <div className="stack schedule">
      <div className="spread wrap">
        <h2 className="title">{t('schedule.title', { year: state.season.year })}</h2>
        {isPro && (
          <button className="btn btn--sm" onClick={() => setPlan(autoPlan(state))}>
            {t('schedule.auto')}
          </button>
        )}
      </div>
      <p>{t('schedule.lead')}</p>

      {!isPro ? (
        <div className="stamp-grid">
          {slots.map((slot, i) => {
            const def = tournament(slot.options[0] as string);
            const on = plan[i] === def.id;
            return (
              <button
                key={def.id}
                className="stamp-cell stamp-toggle"
                aria-pressed={on}
                onClick={() => setPick(i, on ? null : def.id)}
              >
                <Stamp
                  city={c(def.city)}
                  level={def.level}
                  gender={gender}
                  surface={def.surface}
                  caption={monthOf(slot.week, locale)}
                  inked={on}
                  seed={def.id}
                />
                <span className="stamp-cell__name">{c(def.name)}</span>
                <span className="mono pencil stamp-cell__cost">
                  {money(travelCost(state, def), locale)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="weeks">
          {[...months.entries()].map(([month, indices]) => (
            <section key={month} className="weeks__month">
              <h3 className="weeks__label mono">{month}</h3>
              {indices.map((i) => {
                const slot = slots[i]!;
                if (blocked.has(i)) {
                  return (
                    <div key={slot.week} className="week week--blocked">
                      <span className="mono week__n">{slot.week}</span>
                      <span className="hand pencil">
                        ↳ {c(tournament(plan[i - 1] as string).name)}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={slot.week} className="week">
                    <span className="mono week__n">{slot.week}</span>
                    <div className="week__options">
                      {slot.options.map((id) => {
                        const def = tournament(id);
                        const on = plan[i] === id;
                        const entry = entryLabel(id);
                        return (
                          <button
                            key={id}
                            className={`event-chip event-chip--${def.surface}`}
                            aria-pressed={on}
                            onClick={() => setPick(i, on ? null : id)}
                          >
                            <span className="event-chip__badge mono">
                              {LEVELS[def.level].badge[gender]}
                            </span>
                            <span className="event-chip__city">{c(def.city)}</span>
                            <span className={`event-chip__entry entry--${entry.status}`}>
                              {entry.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      <div className="sticky schedule__summary">
        <p className="hand">{t('schedule.count', { n: planned.length })}</p>
        <p className="mono">{t('schedule.travel', { amount: money(travel, locale) })}</p>
        <p className={`mono ${after < 0 ? 'is-bad' : ''}`}>
          {t('schedule.after', { amount: money(after, locale) })}
        </p>
      </div>
      <button className="btn btn--ink btn--block" onClick={() => dispatch({ t: 'schedule', plan })}>
        {t('schedule.go')}
      </button>
    </div>
  );
}
