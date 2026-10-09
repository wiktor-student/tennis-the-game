import {
  ACHIEVEMENTS,
  LEVELS,
  VERDICTS_BY_ID,
  legacyMultiplier,
  tournament,
  type CareerState,
} from '@ttg/engine';
import { Stamp } from '../components/Stamp';
import { useContent, useT, useTg, type MessageKey } from '../i18n';
import { biography } from '../lib/biography';
import { useGo } from '../lib/nav';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

/** The career closes as an encyclopaedia entry with a seal of legacy. */
export function RetiredPhase({ state }: { state: CareerState }) {
  const t = useT();
  const tg = useTg();
  const c = useContent();
  const go = useGo();
  const locale = useSettings((s) => s.locale);
  const { data, submit, close } = useGame();
  if (state.phase.kind !== 'retired' || !data?.summary) return null;
  const s = data.summary;
  const verdict = VERDICTS_BY_ID[s.verdict];
  const gender = state.config.gender;
  const mult = legacyMultiplier(state);
  const titles = [...state.stats.titles]
    .sort(
      (a, b) =>
        Number(LEVELS[b.level].pro) - Number(LEVELS[a.level].pro) ||
        LEVELS[b.level].prestige - LEVELS[a.level].prestige ||
        a.year - b.year,
    )
    .slice(0, 24);
  const sub = data.submission;

  return (
    <div className="stack retired">
      <article className="encyclopedia">
        <p className="label">{t('retired.entry')}</p>
        <h2 className="encyclopedia__name">{s.name}</h2>
        {biography(state, s, locale).map((line, i) => (
          <p key={i} className={i === 0 ? 'encyclopedia__lede' : ''}>
            {line}
          </p>
        ))}
        <p className="pencil">{tg(`retired.reason.${state.phase.reason}` as MessageKey, gender)}</p>
      </article>

      <div className="seal-row">
        <div className="seal" aria-label={`${t('retired.legacy')} ${s.legacy}`}>
          <span className="label">{t('retired.legacy')}</span>
          <span className="seal__value hand">{s.legacy}</span>
          {mult !== null && mult !== 1 && (
            <span className="mono seal__mult">
              {t('retired.multiplier', { x: mult.toFixed(2) })}
            </span>
          )}
        </div>
        <div>
          <p className="label">{t('retired.verdict')}</p>
          <p className="verdict-title">{verdict ? c(verdict.title, gender) : s.verdict}</p>
          {verdict && <p className="hand">{c(verdict.text, gender)}</p>}
        </div>
      </div>

      <div className="submission">
        {!s.rankable && <p className="pencil">{t('retired.unranked')}</p>}
        {s.rankable && sub?.status === 'offline' && (
          <p className="pencil">{t('retired.offline')}</p>
        )}
        {sub?.status === 'pending' && <p className="hand">{t('retired.submitting')}</p>}
        {sub?.status === 'done' && (
          <p className="row wrap">
            <span className="tag tag--up">✓ {t('retired.submitted')}</span>
            {sub.result.positions.daily && (
              <span className="tag">
                {t('retired.position', { board: t('home.daily'), n: sub.result.positions.daily })}
              </span>
            )}
            {sub.result.positions.today && (
              <span className="tag">
                {t('retired.position', { board: t('board.today'), n: sub.result.positions.today })}
              </span>
            )}
            {sub.result.positions.week && (
              <span className="tag">
                {t('retired.position', { board: t('board.week'), n: sub.result.positions.week })}
              </span>
            )}
          </p>
        )}
        {sub?.status === 'error' && (
          <p className="row wrap">
            <span className="tag tag--down">
              {t('retired.submitError', { reason: sub.reason })}
            </span>
            <button className="btn btn--sm" onClick={() => void submit()}>
              {t('retired.retry')}
            </button>
          </p>
        )}
      </div>

      {data.newAchievements.length > 0 && (
        <section className="stack">
          <h3 className="label">{t('retired.newAchievements')}</h3>
          <ul className="medal-list">
            {data.newAchievements.map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              return a ? (
                <li key={id} className={`medal medal--${a.tier}`}>
                  <span className="medal__disc" aria-hidden="true" />
                  <span>
                    <strong>{c(a.name, gender)}</strong>
                    <span className="pencil"> — {c(a.description, gender)}</span>
                  </span>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      <section className="stack">
        <h3 className="label">{t('retired.cabinet')}</h3>
        {titles.length === 0 ? (
          <p className="hand pencil">{t('retired.noTitles')}</p>
        ) : (
          <div className="stamp-grid stamp-grid--dense">
            {titles.map((ti, i) => {
              const def = tournament(ti.tournamentId);
              return (
                <div key={i} className="stamp-cell">
                  <Stamp
                    city={c(def.city)}
                    level={def.level}
                    gender={gender}
                    surface={def.surface}
                    caption={String(ti.year)}
                    seed={`${def.id}${ti.year}`}
                    size={76}
                    result="W"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="row wrap">
        <button
          className="btn grow"
          onClick={() => {
            close();
            go('/');
          }}
        >
          {t('common.back')}
        </button>
        <button
          className="btn btn--ink grow"
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
