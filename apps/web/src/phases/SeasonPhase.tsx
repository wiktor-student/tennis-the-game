import { TACTICS_BY_ID, tournament, type CareerState, type TournamentResult } from '@ttg/engine';
import { useEffect, useState } from 'react';
import { Flag, LevelTag, SurfaceTag } from '../components/Badges';
import { Stamp } from '../components/Stamp';
import { Weather } from '../components/Weather';
import { useContent, useT, type MessageKey } from '../i18n';
import { money } from '../lib/format';
import { monthOf, resultShort } from '../panels/Panels';
import { useGame } from '../store/game';
import { simDelay, useSettings } from '../store/settings';

export function SeasonPhase({ state }: { state: CareerState }) {
  const t = useT();
  const dispatch = useGame((s) => s.dispatch);
  const speed = useSettings((s) => s.speed);
  const [auto, setAuto] = useState(false);
  const season = state.season;
  const finished = season.cursor >= season.slots.length && !season.run;

  // Autopilot: one tournament per tick until the notebook needs the player's hand.
  useEffect(() => {
    if (!auto || state.phase.kind !== 'season') return;
    const id = setTimeout(() => dispatch({ t: 'play' }), simDelay(speed));
    return () => clearTimeout(id);
  }, [auto, state, dispatch, speed]);

  useEffect(() => {
    if (state.phase.kind !== 'season') setAuto(false);
  }, [state.phase.kind]);

  const latest = season.results[season.results.length - 1] ?? null;

  return (
    <div className="stack season">
      <div className="spread wrap">
        <div className="row">
          <Weather form={season.form} size={52} />
          <div>
            <h2 className="title">{t('season.title', { year: season.year })}</h2>
            <p className="hand pencil">{t(`form.${season.form}` as MessageKey)}</p>
          </div>
        </div>
        <div className="row wrap">
          {finished ? (
            <button className="btn btn--ink" onClick={() => dispatch({ t: 'play' })}>
              {t('season.end')}
            </button>
          ) : (
            <>
              <button
                className="btn btn--ink"
                disabled={auto}
                onClick={() => dispatch({ t: 'play' })}
              >
                {t('season.next')}
              </button>
              <button className={`btn ${auto ? 'btn--hl' : ''}`} onClick={() => setAuto((a) => !a)}>
                {auto ? t('season.stop') : t('season.auto')}
              </button>
            </>
          )}
        </div>
      </div>

      <Timeline state={state} />

      {latest ? (
        <Protocol state={state} result={latest} />
      ) : (
        <p className="hand empty-note">{t('season.emptyState')}</p>
      )}
    </div>
  );
}

function Timeline({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const season = state.season;
  const results = new Map(season.results.map((r) => [r.tournamentId, r]));
  const items = season.slots
    .map((slot, i) => ({ slot, i, id: season.plan[i] ?? null }))
    .filter((x) => x.id !== null) as {
    slot: (typeof season.slots)[number];
    i: number;
    id: string;
  }[];
  return (
    <div className="timeline" aria-label={t('season.timeline')}>
      {items.map(({ slot, i, id }) => {
        const def = tournament(id);
        const r = results.get(id);
        const current =
          !r &&
          i >= season.cursor &&
          items.find((x) => x.i >= season.cursor && !results.get(x.id))?.i === i;
        return (
          <span
            key={id}
            className={`timeline__dot timeline__dot--${def.surface}`}
            data-state={r ? (r.reached === 0 ? 'title' : 'done') : current ? 'next' : 'todo'}
            title={`${c(def.name)} · ${monthOf(slot.week, locale)}`}
          >
            {r ? resultShort(r.label) : ''}
          </span>
        );
      })}
    </div>
  );
}

function label(t: ReturnType<typeof useT>, r: TournamentResult): string {
  if (r.medal) return t(`medal.${r.medal}` as MessageKey);
  if (r.label === 'DNE') return t('season.notEntered');
  if (r.label === 'INJ') return t('season.injured');
  if (['W', 'F', 'SF', 'QF', 'RR', 'BRONZE'].includes(r.label))
    return t(`round.${r.label}` as MessageKey);
  return r.label;
}

function Protocol({ state, result }: { state: CareerState; result: TournamentResult }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const def = tournament(result.tournamentId);
  const title = result.reached === 0;
  return (
    <article className="card card--clean protocol" data-title={title}>
      <span className="tape tape--tr" />
      <div className="protocol__head">
        <Stamp
          city={c(def.city)}
          level={def.level}
          gender={state.config.gender}
          surface={def.surface}
          caption={String(result.year)}
          seed={def.id}
          size={86}
          result={resultShort(result.label)}
        />
        <div>
          <p className="label">{t('season.protocol')}</p>
          <h3 className="protocol__name">{c(def.name)}</h3>
          <p className="row wrap" style={{ gap: 8 }}>
            <LevelTag level={def.level} gender={state.config.gender} />
            <SurfaceTag surface={def.surface} />
            {result.entry === 'qualifier' && (
              <span className="tag">{t('season.entry.qualifier')}</span>
            )}
            {result.entry === 'wildcard' && (
              <span className="tag">{t('season.entry.wildcard')}</span>
            )}
            {result.entry === 'exempt' && <span className="tag">{t('season.entry.exempt')}</span>}
          </p>
        </div>
        <p className={`protocol__result hand ${title ? 'hl' : ''}`}>{label(t, result)}</p>
      </div>

      {result.matches.length > 0 && (
        <table className="sheet protocol__matches">
          <tbody>
            {result.matches.map((m, i) => (
              <tr key={i} className={m.won ? 'won' : 'lost'}>
                <td className="mono">{m.round}</td>
                <td>
                  <Flag nat={m.oppNat} /> {m.oppName}
                  {m.oppSeed && <span className="pencil mono"> [{m.oppSeed}]</span>}
                  {m.nemesis && <span className="nemesis">Nemesis</span>}
                  <span className="protocol__tactic hand">
                    {m.tactic
                      ? `${m.keyMatch ? '♠ ' : ''}${c(TACTICS_BY_ID[m.tactic]!.name)}`
                      : t('season.auto.played')}
                  </span>
                </td>
                <td className="mono r">{m.scoreText}</td>
                <td className="hand protocol__wl">{m.won ? 'W' : 'L'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="row wrap protocol__foot">
        {result.points > 0 && (
          <span className="tag tag--up">{t('season.points', { n: result.points })}</span>
        )}
        {result.prize > 0 && <span className="tag tag--up">+{money(result.prize, locale)}</span>}
        {result.rankAfter !== null && state.season.stage === 'pro' && (
          <span className="tag">{t('season.rankAfter', { rank: `#${result.rankAfter}` })}</span>
        )}
        {result.championName && result.reached !== 0 && (
          <span className="pencil">{t('season.champion', { name: result.championName })}</span>
        )}
      </p>
    </article>
  );
}
