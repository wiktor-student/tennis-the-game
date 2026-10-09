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

  return (
    <div className="panel panel--court stack season-end">
      <h2 className="phase-title">{t('end.title', { year: r.year })}</h2>

      {headline && (
        <figure className="newspaper">
          <figcaption className="newspaper__outlet">
            {outlet} · {r.year}
          </figcaption>
          <blockquote className="newspaper__headline">
            {c(headline, state.config.gender, vars)}
          </blockquote>
        </figure>
      )}

      <dl className="stat-grid">
        <div>
          <dt>{t('end.rank')}</dt>
          <dd className="num">
            {r.rankEnd === null ? '—' : isPro ? `#${r.rankEnd}` : `P${r.rankEnd}`}
          </dd>
        </div>
        <div>
          <dt>{t('end.titles')}</dt>
          <dd className="num">{r.titles.length}</dd>
        </div>
        <div>
          <dt>{t('end.record')}</dt>
          <dd className="num">
            {r.won}–{r.lost}
          </dd>
        </div>
        <div>
          <dt>{t('end.prize')}</dt>
          <dd className="num">{money(r.prize, locale)}</dd>
        </div>
        <div>
          <dt>{t('end.ovr')}</dt>
          <dd className="num">
            {r.ovr} → {overall(state.player.skills)}
          </dd>
        </div>
        <div>
          <dt>{t('end.legacy')}</dt>
          <dd className="num">
            {r.legacyAfter}
            {prev && r.legacyAfter !== prev.legacyAfter && (
              <small className="is-positive"> {signed(r.legacyAfter - prev.legacyAfter)}</small>
            )}
          </dd>
        </div>
      </dl>

      {r.titles.length > 0 && (
        <ul className="title-list">
          {r.titles.map((id, i) => (
            <li key={`${id}-${i}`}>{c(tournament(id).name)}</li>
          ))}
        </ul>
      )}

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button
          className="btn btn--primary"
          style={{ flex: 2 }}
          onClick={() => dispatch({ t: 'continue' })}
        >
          {t('end.next')}
        </button>
        <button
          className="btn btn--danger"
          style={{ flex: 1 }}
          disabled={!canRetire(state)}
          title={canRetire(state) ? undefined : t('end.retireLocked')}
          onClick={() => setConfirm(true)}
        >
          {t('end.retire')}
        </button>
      </div>
      {!canRetire(state) && (
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {t('end.retireLocked')}
        </p>
      )}

      <ConfirmDialog
        open={confirm}
        title={t('end.retire')}
        text={t('end.retireConfirm')}
        confirmLabel={t('end.retire')}
        cancelLabel={t('new.back')}
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
