import { HEADLINES, OUTLETS, canRetire, overall, tournament, type CareerState } from '@ttg/engine';
import { useState } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { useContent, useT } from '../i18n';
import { money, signed } from '../lib/format';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function SeasonEndPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const dispatch = useGame((s) => s.dispatch);
  const [confirm, setConfirm] = useState(false);
  if (state.phase.kind !== 'season_end') return null;
  const r = state.phase.record;
  const prev = state.history[state.history.length - 2];
  const headline = r.headline ? HEADLINES[r.headline.templateId] : null;
  const outlet = OUTLETS[r.year % OUTLETS.length];
  const isPro = r.stage === 'pro';
  const vars = r.headline
    ? {
        ...r.headline.vars,
        ...(typeof r.headline.vars.eventId === 'string'
          ? { event: c(tournament(r.headline.vars.eventId).name) }
          : {}),
      }
    : {};
  const ovrNow = overall(state.player.skills);
  const legacyGain = prev ? r.legacyAfter - prev.legacyAfter : r.legacyAfter;

  return (
    <div className="stack season-end">
      <h2 className="title">{t('end.title', { year: r.year })}</h2>

      {headline && (
        <figure className="clipping">
          <span className="tape tape--tl" />
          <span className="tape tape--tr" />
          <figcaption className="clipping__outlet">
            {outlet} · {r.year}
          </figcaption>
          <blockquote className="clipping__headline">
            {c(headline, state.config.gender, vars)}
          </blockquote>
          <p className="clipping__body" aria-hidden="true" />
        </figure>
      )}

      <dl className="notes-grid">
        <div>
          <dt className="label">{t('end.rank')}</dt>
          <dd className="hand">
            {r.rankEnd === null ? '—' : isPro ? `#${r.rankEnd}` : `${r.rankEnd}.`}
          </dd>
        </div>
        <div>
          <dt className="label">{t('end.record')}</dt>
          <dd className="hand">
            {r.won}–{r.lost}
          </dd>
        </div>
        <div>
          <dt className="label">{t('end.titles')}</dt>
          <dd className="hand">{r.titles.length}</dd>
        </div>
        <div>
          <dt className="label">{t('end.prize')}</dt>
          <dd className="hand">{money(r.prize, locale)}</dd>
        </div>
        <div>
          <dt className="label">{t('end.ovr')}</dt>
          <dd className="hand">
            {r.ovr} → <span className="hl">{ovrNow}</span>
          </dd>
        </div>
        <div>
          <dt className="label">{t('end.legacy')}</dt>
          <dd className="hand">
            {r.legacyAfter}{' '}
            {legacyGain > 0 && <small className="is-good">({signed(legacyGain)})</small>}
          </dd>
        </div>
      </dl>

      {r.titles.length > 0 && (
        <ul className="trophy-list">
          {r.titles.map((id, i) => (
            <li key={`${id}-${i}`} className="hand">
              {c(tournament(id).name)}
            </li>
          ))}
        </ul>
      )}

      <div className="row wrap">
        <button className="btn btn--ink grow" onClick={() => dispatch({ t: 'continue' })}>
          {t('end.next')}
        </button>
        <button
          className="btn btn--danger"
          disabled={!canRetire(state)}
          onClick={() => setConfirm(true)}
        >
          {t('end.retire')}
        </button>
      </div>
      {!canRetire(state) && <p className="pencil">{t('end.retireLocked')}</p>}

      <ConfirmDialog
        open={confirm}
        title={t('end.retire')}
        text={t('end.retireConfirm')}
        confirmLabel={t('end.retire')}
        cancelLabel={t('common.back')}
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          dispatch({ t: 'retire' });
        }}
      />
    </div>
  );
}
