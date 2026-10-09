import {
  COACH_ORDER,
  COACHES,
  FITNESS_COACH,
  PHYSIO,
  TACTICS,
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
  const after =
    state.finance.budget - staffCost(state, coach, physio, fitnessCoach) - equipmentCost(state);

  return (
    <div className="stack">
      <h2 className="title">{t('team.title')}</h2>
      <p>{t('team.lead')}</p>
      <div className="coach-grid">
        {COACH_ORDER.map((id) => {
          const def = COACHES[id];
          const locked = id !== state.team.coach && state.player.reputation < def.minReputation;
          const teaches = TACTICS.filter((x) => x.teacher === id).map((x) => c(x.name));
          return (
            <button
              key={id}
              className="pick coach"
              aria-pressed={coach === id}
              disabled={locked}
              onClick={() => setCoach(id)}
            >
              <span className="spread">
                <span className="pick__title">{c(def.name)}</span>
                {id === state.team.coach && <span className="tag">{t('team.current')}</span>}
              </span>
              <span className="hand coach__quote">„{c(def.description)}”</span>
              <span className="mono coach__meta">
                {def.salary === 0
                  ? t('team.free')
                  : t('team.salary', { amount: money(def.salary, locale) })}{' '}
                · {t('team.growth', { x: def.growth.toFixed(2) })}
              </span>
              <span className="pick__meta">
                {teaches.length
                  ? t('team.teaches', { cards: teaches.join(', ') })
                  : t('team.teachesNone')}
              </span>
              {locked && (
                <span className="tag tag--down">
                  {t('team.requires', { rep: def.minReputation })}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="row wrap" style={{ gap: 24 }}>
        <label className="tick">
          <input type="checkbox" checked={physio} onChange={(e) => setPhysio(e.target.checked)} />
          <span>
            {t('team.physio')} <span className="mono pencil">({money(PHYSIO.salary, locale)})</span>
          </span>
        </label>
        <label className="tick">
          <input
            type="checkbox"
            checked={fitnessCoach}
            onChange={(e) => setFitnessCoach(e.target.checked)}
          />
          <span>
            {t('team.fitness')}{' '}
            <span className="mono pencil">({money(FITNESS_COACH.salary, locale)})</span>
          </span>
        </label>
      </div>
      <p className="hand budget-line">
        {t('team.after')} <span className={after < 0 ? 'is-bad' : ''}>{money(after, locale)}</span>
      </p>
      <button
        className="btn btn--ink btn--block"
        onClick={() => dispatch({ t: 'team', coach, physio, fitnessCoach })}
      >
        {t('team.next')}
      </button>
    </div>
  );
}
