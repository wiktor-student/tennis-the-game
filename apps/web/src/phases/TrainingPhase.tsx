import {
  BACKGROUNDS,
  COACHES,
  SKILL_IDS,
  SKILL_INFO,
  TACTIC_BLOCK_COST,
  TACTICS_BY_ID,
  blocksGain,
  learnableTactics,
  masteryLevel,
  tacticEdge,
  trainingBlocks,
  type CareerState,
  type SkillId,
} from '@ttg/engine';
import { useState } from 'react';
import { TacticCard } from '../components/TacticCard';
import { useContent, useT } from '../i18n';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

const SKILL_COLOR: Record<SkillId, string> = {
  serve: 'var(--hard)',
  return: 'var(--indoor)',
  forehand: 'var(--clay)',
  backhand: 'var(--grass)',
  net: '#2a8a8a',
  fitness: '#b0762a',
  mental: 'var(--margin)',
};

export function TrainingPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const total = trainingBlocks(state);
  const learnable = learnableTactics(state);
  const [alloc, setAlloc] = useState<Partial<Record<SkillId, number>>>({});
  const [rest, setRest] = useState(0);
  const [learn, setLearn] = useState<string | null>(null);
  const [preferred, setPreferred] = useState(state.tactics.preferred);
  const used =
    Object.values(alloc).reduce((a, b) => a + (b ?? 0), 0) + rest + (learn ? TACTIC_BLOCK_COST : 0);
  const free = total - used;
  const first = state.history.length === 0;
  const p = state.player;
  const coach = COACHES[state.team.coach];

  const add = (id: SkillId, d: number) =>
    setAlloc((a) => ({ ...a, [id]: Math.max(0, (a[id] ?? 0) + d) }));

  // Block strip: one coloured tile per block, in allocation order.
  const tiles: { color: string; label: string }[] = [];
  for (const id of SKILL_IDS)
    for (let i = 0; i < (alloc[id] ?? 0); i++)
      tiles.push({ color: SKILL_COLOR[id], label: SKILL_INFO[id].short[locale] });
  for (let i = 0; i < rest; i++)
    tiles.push({ color: 'var(--pencil-2)', label: t('training.rest') });
  if (learn)
    for (let i = 0; i < TACTIC_BLOCK_COST; i++) tiles.push({ color: 'var(--ink)', label: '♠' });
  while (tiles.length < total) tiles.push({ color: 'transparent', label: '' });

  const deck = learn ? [...state.tactics.owned, learn] : state.tactics.owned;
  const neutral = { style: 'allround' as const };

  return (
    <div className="stack training">
      {first && (
        <div className="card card--clean letter-intro">
          <span className="tape tape--tr tape--blue" />
          <p className="lead">{c(BACKGROUNDS[state.config.background].intro, p.gender)}</p>
        </div>
      )}
      <h2 className="title">{t('training.title')}</h2>
      <p>{t('training.lead', { n: total })}</p>

      <div className="block-strip" aria-label={t('training.blocks')}>
        {tiles.map((tile, i) => (
          <span
            key={i}
            className="block-strip__tile"
            style={{ background: tile.color }}
            title={tile.label}
          >
            {tile.label === '♠' ? '♠' : ''}
          </span>
        ))}
        <span className="hand block-strip__left">{t('training.left', { n: free })}</span>
      </div>

      <div className="drills">
        {SKILL_IDS.map((id) => {
          const n = alloc[id] ?? 0;
          return (
            <div key={id} className="drill" data-active={n > 0}>
              <span className="drill__swatch" style={{ background: SKILL_COLOR[id] }} />
              <div className="drill__text">
                <strong>{SKILL_INFO[id].name[locale]}</strong>
                <span className="pencil drill__hint">{SKILL_INFO[id].hint[locale]}</span>
              </div>
              <span className="mono drill__value">{Math.round(p.skills[id])}</span>
              <span className="hand drill__gain">
                {n > 0 ? t('training.gain', { x: blocksGain(state, id, n).toFixed(1) }) : ''}
              </span>
              <div className="stepper">
                <button type="button" aria-label="−" disabled={n === 0} onClick={() => add(id, -1)}>
                  −
                </button>
                <span className="mono">{n}</span>
                <button
                  type="button"
                  aria-label="+"
                  disabled={free <= 0}
                  onClick={() => add(id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        <div className="drill" data-active={rest > 0}>
          <span className="drill__swatch" style={{ background: 'var(--pencil-2)' }} />
          <div className="drill__text">
            <strong>{t('training.rest')}</strong>
            <span className="pencil drill__hint">{t('training.restHint')}</span>
          </div>
          <span />
          <span />
          <div className="stepper">
            <button
              type="button"
              aria-label="−"
              disabled={rest === 0}
              onClick={() => setRest(rest - 1)}
            >
              −
            </button>
            <span className="mono">{rest}</span>
            <button
              type="button"
              aria-label="+"
              disabled={free <= 0}
              onClick={() => setRest(rest + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <section className="stack">
        <h3 className="label">{t('training.learn')}</h3>
        {learnable.length === 0 ? (
          <p className="hand pencil">{t('training.noLearn')}</p>
        ) : (
          <>
            <p className="pencil">
              {t('training.learnHint', { n: TACTIC_BLOCK_COST, coach: c(coach.name) })}
            </p>
            <div className="hand-grid">
              {learnable.map((id) => (
                <div key={id} className="learn-slot" data-picked={learn === id}>
                  <TacticCard
                    view={tacticEdge(state, id, neutral, 'hard')}
                    onPlay={() => setLearn(learn === id ? null : id)}
                    disabled={learn !== id && free < TACTIC_BLOCK_COST}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="stack">
        <h3 className="label">{t('training.preferred')}</h3>
        <p className="pencil">{t('training.preferredHint')}</p>
        <div className="row wrap">
          {deck.map((id) => (
            <label key={id} className="tick">
              <input
                type="radio"
                name="preferred"
                checked={preferred === id}
                onChange={() => setPreferred(id)}
              />
              <span>
                {c(TACTICS_BY_ID[id]!.name)}
                {masteryLevel(state, id) > 0 && (
                  <span className="pencil"> {'★'.repeat(masteryLevel(state, id))}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </section>

      <button
        className="btn btn--ink btn--block"
        disabled={free !== 0}
        onClick={() =>
          dispatch({
            t: 'train',
            plan: {
              skills: alloc,
              rest,
              learn,
              preferred: deck.includes(preferred) ? preferred : state.tactics.preferred,
            },
          })
        }
      >
        {t('training.done')}
      </button>
    </div>
  );
}
