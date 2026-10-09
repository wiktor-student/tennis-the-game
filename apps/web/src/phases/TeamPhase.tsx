import {
  COACH_ORDER,
  COACHES,
  FITNESS_COACH,
  PHYSIO,
  equipmentCost,
  staffCost,
  type CareerState,
  type CoachId,
} from '@ttg/engine';
import { useState } from 'react';
import { useContent, useT } from '../i18n';
import { money } from '../lib/format';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function TeamPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const [coach, setCoach] = useState<CoachId>(state.team.coach);
  const [physio, setPhysio] = useState(state.team.physio);
  const [fitnessCoach, setFitnessCoach] = useState(state.team.fitnessCoach);

  const staff = staffCost(state, coach, physio, fitnessCoach);
  const after = state.finance.budget - staff - equipmentCost(state);

  return (
    <div className="panel panel--court stack">
      <div>
        <h2 className="phase-title">{t('phase.team')}</h2>
        <p className="muted">{t('phase.teamHint')}</p>
      </div>
      <div className="choices">
        {COACH_ORDER.map((id) => {
          const def = COACHES[id];
          const locked = id !== state.team.coach && state.player.reputation < def.minReputation;
          return (
            <button
              key={id}
              className="choice"
              aria-pressed={coach === id}
              disabled={locked}
              onClick={() => setCoach(id)}
            >
              <span className="choice__title">
                {c(def.name)}{' '}
                {id === state.team.coach && <span className="chip">{t('phase.current')}</span>}
              </span>
              <span className="choice__aside num">
                {def.salary === 0
                  ? '0 zł'
                  : t('phase.salary', { amount: money(def.salary, locale) })}
              </span>
              <span className="choice__meta">
                {c(def.description)} · {t('phase.growth', { x: def.growth.toFixed(2) })}
                {locked && ` · ${t('phase.requires', { rep: def.minReputation })}`}
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid-2">
        <label className="toggle panel">
          <input type="checkbox" checked={physio} onChange={(e) => setPhysio(e.target.checked)} />
          <span>
            <strong>{t('side.physio')}</strong>
            <br />
            <small className="muted">
              {t('phase.salary', { amount: money(PHYSIO.salary, locale) })}
            </small>
          </span>
        </label>
        <label className="toggle panel">
          <input
            type="checkbox"
            checked={fitnessCoach}
            onChange={(e) => setFitnessCoach(e.target.checked)}
          />
          <span>
            <strong>{t('side.fitnessCoach')}</strong>
            <br />
            <small className="muted">
              {t('phase.salary', { amount: money(FITNESS_COACH.salary, locale) })}
            </small>
          </span>
        </label>
      </div>
      <dl className="budget-sheet">
        <dt>{t('budget.onAccount')}</dt>
        <dd className="num">{money(state.finance.budget, locale)}</dd>
        <dt>{t('budget.staff')}</dt>
        <dd className="num is-negative">{money(-staff, locale)}</dd>
        <dt>{t('budget.equipment')}</dt>
        <dd className="num is-negative">{money(-equipmentCost(state), locale)}</dd>
        <dt>{t('budget.after')}</dt>
        <dd className={`num ${after < 0 ? 'is-negative' : ''}`}>{money(after, locale)}</dd>
      </dl>
      <button
        className="btn btn--primary btn--block"
        onClick={() => dispatch({ t: 'team', coach, physio, fitnessCoach })}
      >
        {t('phase.next')}
      </button>
    </div>
  );
}
