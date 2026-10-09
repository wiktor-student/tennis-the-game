import { STYLE_INFO, tournament, type CareerState } from '@ttg/engine';
import { useEffect, useRef } from 'react';
import { Flag, SurfaceTag } from '../components/Badges';
import { TacticCard } from '../components/TacticCard';
import { useContent, useT, useTg } from '../i18n';
import { useGame } from '../store/game';

/** Before a key match: read the scouting report, play a tactic card. */
export function TacticsPhase({ state }: { state: CareerState }) {
  const t = useT();
  const tg = useTg();
  const c = useContent();
  const dispatch = useGame((s) => s.dispatch);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scout = state.phase.kind === 'tactics' ? state.phase.scout : null;

  useEffect(() => {
    headingRef.current?.focus();
  }, [scout?.oppId, scout?.round]);

  if (!scout) return null;
  const def = tournament(scout.tournamentId);
  const style = STYLE_INFO[scout.oppStyle];
  const gender = state.config.gender;
  const delta = scout.oppDelta;
  const strength =
    Math.abs(delta) <= 1
      ? tg('scout.even', gender)
      : delta > 0
        ? tg('scout.stronger', gender, { n: delta })
        : tg('scout.weaker', gender, { n: -delta });
  const count = scout.options.length;

  return (
    <div className="stack tactics">
      <section className="dossier">
        <span className="dossier__tab label">{t('scout.title')}</span>
        <p className="label">{t('scout.round', { round: scout.round, event: c(def.name) })}</p>
        <h2 ref={headingRef} tabIndex={-1} className="dossier__name">
          <Flag nat={scout.oppNat} /> {scout.oppName}
          {scout.oppSeed && <span className="mono pencil"> [{scout.oppSeed}]</span>}
          {scout.oppRank && <span className="mono pencil"> #{scout.oppRank}</span>}
        </h2>
        <dl className="dossier__facts">
          <div>
            <dt className="label">{t('scout.style')}</dt>
            <dd>{c(style.name, gender)}</dd>
          </div>
          <div>
            <dt className="label">{t('scout.strength')}</dt>
            <dd className={delta > 2 ? 'is-bad' : delta < -2 ? 'is-good' : ''}>{strength}</dd>
          </div>
          <div>
            <dt className="label">{t('scout.hand')}</dt>
            <dd>{scout.oppHand === 'L' ? t('id.handL') : t('id.handR')}</dd>
          </div>
          <div>
            <dt className="label">{t('scout.surface')}</dt>
            <dd>
              <SurfaceTag surface={scout.surface} />
            </dd>
          </div>
        </dl>
        <p className="hand dossier__note">{c(style.scout, gender)}</p>
        {scout.nemesis && <p className="hand dossier__nemesis">{t('scout.nemesis')}</p>}
      </section>

      <h3 className="label">{t('scout.pick')}</h3>
      <div
        className="fan"
        data-wide={count > 5}
        style={{ '--count': count } as React.CSSProperties}
      >
        {scout.options.map((view, i) => (
          <div
            key={view.tacticId}
            className="fan__slot"
            style={
              { '--i': i - (count - 1) / 2, '--tilt': ((i * 7) % 5) - 2 } as React.CSSProperties
            }
          >
            <TacticCard view={view} onPlay={() => dispatch({ t: 'choose', option: i })} />
          </div>
        ))}
      </div>
      <p className="pencil tactics__hint">{t('scout.hint')}</p>
    </div>
  );
}
