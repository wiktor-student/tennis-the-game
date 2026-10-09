import { ACHIEVEMENTS, LEVELS, VERDICTS_BY_ID, legacyMultiplier, tournament, type CareerState } from '@ttg/engine';
import { LevelBadge, SurfaceDot } from '../components/Badges';
import { useContent, useT, type MessageKey } from '../i18n';
import { money } from '../lib/format';
import { useGo } from '../lib/nav';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function RetiredPhase({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const go = useGo();
  const locale = useSettings((s) => s.locale);
  const { data, submit, close } = useGame();
  if (state.phase.kind !== 'retired' || !data?.summary) return null;
  const s = data.summary;
  const verdict = VERDICTS_BY_ID[s.verdict];
  const gender = state.config.gender;
  const mult = legacyMultiplier(state);
  const proTitles = state.stats.titles.filter((x) => LEVELS[x.level].pro).reverse();
  const juniorTitles = state.stats.titles.filter((x) => !LEVELS[x.level].pro);
  const sub = data.submission;

  return (
    <div className="stack retired">
      <section className="panel panel--court verdict">
        <p className="eyebrow">{t('retired.title')}</p>
        <p className="muted serif">{t(`retired.reason.${state.phase.reason}` as MessageKey)}</p>
        <p className="eyebrow verdict__label">{t('retired.verdict')}</p>
        <h2 className="verdict__title">{verdict ? c(verdict.title, gender) : s.verdict}</h2>
        {verdict && <p className="narrative verdict__text">{c(verdict.text, gender)}</p>}
        <div className="legacy-score">
          <span className="eyebrow">LEGACY</span>
          <span className="legacy-score__value num">{s.legacy}</span>
          {mult !== null && mult !== 1 && <span className="muted">{t('retired.multiplier', { x: mult.toFixed(2) })}</span>}
        </div>

        <dl className="stat-grid">
          <div>
            <dt>{t('retired.stats.seasons')}</dt>
            <dd className="num">{s.seasons}</dd>
          </div>
          <div>
            <dt>{t('retired.stats.peak')}</dt>
            <dd className="num">{s.peakRank ? `#${s.peakRank}` : '—'}</dd>
          </div>
          <div>
            <dt>{t('retired.stats.slams')}</dt>
            <dd className="num">{s.slamTitles}</dd>
          </div>
          <div>
            <dt>{t('retired.stats.titles')}</dt>
            <dd className="num">{s.proTitles}</dd>
          </div>
          <div>
            <dt>{t('retired.stats.prize')}</dt>
            <dd className="num">{money(s.prizeMoney, locale)}</dd>
          </div>
          <div>
            <dt>{t('retired.stats.wl')}</dt>
            <dd className="num">
              {s.proWins}–{s.proLosses}
            </dd>
          </div>
          {s.weeksAtNo1 > 0 && (
            <div>
              <dt>{t('retired.stats.weeks')}</dt>
              <dd className="num">{s.weeksAtNo1}</dd>
            </div>
          )}
        </dl>

        <div className="submission">
          {!s.rankable && <p className="muted">{t('retired.unranked')}</p>}
          {s.rankable && sub?.status === 'offline' && <p className="muted">{t('retired.offline')}</p>}
          {sub?.status === 'pending' && <p className="muted">{t('retired.submitting')}</p>}
          {sub?.status === 'done' && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span className="chip chip--up">✓ {t('retired.submitted')}</span>
              {sub.result.positions.daily && <span className="chip">{t('retired.position', { board: t('menu.daily'), n: sub.result.positions.daily })}</span>}
              {sub.result.positions.today && <span className="chip">{t('retired.position', { board: t('board.today'), n: sub.result.positions.today })}</span>}
              {sub.result.positions.week && <span className="chip">{t('retired.position', { board: t('board.week'), n: sub.result.positions.week })}</span>}
            </div>
          )}
          {sub?.status === 'error' && (
            <div className="row">
              <span className="chip chip--down">{t('retired.submitError', { reason: sub.reason })}</span>
              <button className="btn btn--sm" onClick={() => void submit()}>
                {t('retired.retry')}
              </button>
            </div>
          )}
        </div>
      </section>

      {data.newAchievements.length > 0 && (
        <section className="panel">
          <h3 className="eyebrow panel__title">{t('retired.newAchievements')}</h3>
          <ul className="ach-strip">
            {data.newAchievements.map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              return a ? (
                <li key={id} className={`ach-mini ach-mini--${a.tier}`}>
                  <strong>{c(a.name, gender)}</strong>
                  <span className="muted">{c(a.description, gender)}</span>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      <section className="panel">
        <h3 className="eyebrow panel__title">{t('retired.cabinet')}</h3>
        {proTitles.length + juniorTitles.length === 0 && <p className="muted serif">{t('retired.noTitles')}</p>}
        <ul className="cabinet">
          {[...proTitles, ...juniorTitles].slice(0, 60).map((ti, i) => {
            const def = tournament(ti.tournamentId);
            return (
              <li key={i} className={`cabinet__item ${ti.level === 'gs' ? 'cabinet__item--slam' : ''}`}>
                <SurfaceDot surface={def.surface} />
                <span>{c(def.name)}</span>
                <LevelBadge level={def.level} gender={gender} />
                <span className="num muted">{ti.year}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="row">
        <button
          className="btn btn--ghost"
          style={{ flex: 1 }}
          onClick={() => {
            close();
            go('/');
          }}
        >
          {t('menu.back')}
        </button>
        <button
          className="btn btn--primary"
          style={{ flex: 1 }}
          onClick={() => {
            close();
            go('/slots');
          }}
        >
          {t('retired.newCareer')}
        </button>
      </div>
    </div>
  );
}
