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
import { LevelBadge, SurfaceDot } from '../components/Badges';
import { useContent, useT } from '../i18n';
import { money, pct } from '../lib/format';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

const MONTHS_PL = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];
const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function SchedulePhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const slots = state.season.slots;
  const [plan, setPlan] = useState<(string | null)[]>(state.season.plan);
  const isPro = state.season.stage === 'pro';
  const gender = state.config.gender;
  const months = locale === 'pl' ? MONTHS_PL : MONTHS_EN;

  const blocked = useMemo(() => {
    const set = new Set<number>();
    plan.forEach((id, i) => {
      if (!id) return;
      const def = tournament(id);
      if (def.span > 1 && slots[i + 1] && slots[i + 1]!.week < def.week + def.span) set.add(i + 1);
    });
    return set;
  }, [plan, slots]);

  const planned = plan.filter((id, i) => id && !blocked.has(i)) as string[];
  const travel = planned.reduce((n, id) => n + travelCost(state, tournament(id)), 0);
  const after =
    state.finance.budget -
    staffCost(state) -
    equipmentCost(state) +
    state.sponsors.reduce((n, s) => n + s.amount, 0) -
    travel;

  const setPick = (i: number, id: string | null) =>
    setPlan((p) => p.map((x, j) => (j === i ? id : x)));

  return (
    <div className="panel panel--court stack">
      <div className="spread" style={{ flexWrap: 'wrap' }}>
        <div>
          <h2 className="phase-title">{t('phase.schedule')}</h2>
          <p className="muted">{t('phase.scheduleHint')}</p>
        </div>
        {isPro && (
          <button className="btn btn--sm" onClick={() => setPlan(autoPlan(state))}>
            {t('phase.autoPlan')}
          </button>
        )}
      </div>

      <ol className="schedule">
        {slots.map((slot, i) => {
          const month = months[Math.min(11, Math.floor((slot.week - 1) / 4.35))];
          const pick = plan[i] ?? null;
          if (blocked.has(i)) {
            return (
              <li key={slot.week} className="schedule__row schedule__row--blocked">
                <span className="schedule__week num">{month}</span>
                <span className="muted">↳ {c(tournament(plan[i - 1] as string).name)}</span>
              </li>
            );
          }
          if (!isPro) {
            const def = tournament(slot.options[0] as string);
            const on = pick === def.id;
            return (
              <li key={slot.week} className="schedule__row">
                <span className="schedule__week num">{month}</span>
                <label className="toggle schedule__event">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setPick(i, e.target.checked ? def.id : null)}
                  />
                  <SurfaceDot surface={def.surface} />
                  <span>{c(def.name)}</span>
                  <LevelBadge level={def.level} gender={gender} />
                </label>
                <span className="num muted">{money(travelCost(state, def), locale)}</span>
              </li>
            );
          }
          const pickDef = pick ? tournament(pick) : null;
          const entry = pickDef ? projectEntry(state, pickDef) : null;
          return (
            <li key={slot.week} className="schedule__row">
              <span className="schedule__week num">{month}</span>
              <span className="schedule__event">
                {pickDef && <SurfaceDot surface={pickDef.surface} />}
                <select
                  className="select"
                  value={pick ?? ''}
                  onChange={(e) => setPick(i, e.target.value || null)}
                  aria-label={`${month} ${slot.week}`}
                >
                  <option value="">{t('phase.rest')}</option>
                  {slot.options.map((id) => {
                    const def = tournament(id);
                    const ent = projectEntry(state, def);
                    const tag =
                      ent.status === 'direct'
                        ? t('entry.direct')
                        : ent.status === 'qualifier'
                          ? t('entry.qualifier')
                          : ent.status === 'exempt'
                            ? t('entry.exempt')
                            : ent.status === 'wildcard'
                              ? t('entry.wildcard', { p: pct(ent.wildcard) })
                              : t('entry.none');
                    return (
                      <option key={id} value={id}>
                        {LEVELS[def.level].badge[gender]} · {c(def.name)} · {tag}
                      </option>
                    );
                  })}
                </select>
              </span>
              <span className="schedule__entry">
                {entry && (
                  <span className={`entry entry--${entry.status}`}>
                    {entry.status === 'wildcard'
                      ? t('entry.wildcard', { p: pct(entry.wildcard) })
                      : t(`entry.${entry.status}`)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <dl className="budget-sheet">
        <dt>{t('budget.onAccount')}</dt>
        <dd className="num">{money(state.finance.budget, locale)}</dd>
        <dt>{t('budget.staff')}</dt>
        <dd className="num is-negative">{money(-staffCost(state), locale)}</dd>
        <dt>{t('budget.equipment')}</dt>
        <dd className="num is-negative">{money(-equipmentCost(state), locale)}</dd>
        {state.sponsors.length > 0 && (
          <>
            <dt>{t('budget.sponsors')}</dt>
            <dd className="num is-positive">
              +
              {money(
                state.sponsors.reduce((n, s) => n + s.amount, 0),
                locale,
              )}
            </dd>
          </>
        )}
        <dt>{t('budget.travel')}</dt>
        <dd className="num is-negative">{money(-travel, locale)}</dd>
        <dt>{t('budget.after')}</dt>
        <dd className={`num ${after < 0 ? 'is-negative' : ''}`}>{money(after, locale)}</dd>
      </dl>
      <p className="muted">
        {t('phase.planned', { n: planned.length, amount: money(travel, locale) })}
      </p>
      <button
        className="btn btn--primary btn--block"
        onClick={() => dispatch({ t: 'schedule', plan })}
      >
        {t('phase.startSeason')}
      </button>
    </div>
  );
}
