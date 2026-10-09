import {
  BACKGROUNDS,
  COACHES,
  SKILL_IDS,
  SKILL_INFO,
  trainingGain,
  type CareerState,
  type SkillId,
} from '@ttg/engine';
import { useState } from 'react';
import { useContent, useT } from '../i18n';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function TrainingPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const [skill, setSkill] = useState<SkillId | null>(null);
  const first = state.history.length === 0;
  const gain = trainingGain(state);
  const p = state.player;

  return (
    <div className="panel panel--court stack">
      {first && (
        <>
          <p className="narrative">{c(BACKGROUNDS[state.config.background].intro, p.gender)}</p>
          <p className="eyebrow">{BACKGROUNDS[state.config.background].name[locale]}</p>
        </>
      )}
      <div>
        <h2 className="phase-title">{t('phase.training')}</h2>
        <p className="muted">
          {t('phase.trainingHint', {
            coach: c(COACHES[state.team.coach].name),
            gain: gain.toFixed(1),
          })}
        </p>
      </div>
      <div className="choices">
        {SKILL_IDS.map((id) => (
          <button
            key={id}
            className="choice"
            aria-pressed={skill === id}
            onClick={() => setSkill(id)}
          >
            <span className="choice__title">{SKILL_INFO[id].name[locale]}</span>
            <span className="choice__aside num">{Math.round(p.skills[id])}</span>
            <span className="choice__meta">{SKILL_INFO[id].hint[locale]}</span>
          </button>
        ))}
      </div>
      <button
        className="btn btn--primary btn--block"
        disabled={!skill}
        onClick={() => skill && dispatch({ t: 'train', skill })}
      >
        {t('phase.next')}
      </button>
    </div>
  );
}
