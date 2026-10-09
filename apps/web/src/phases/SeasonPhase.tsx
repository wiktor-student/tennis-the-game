import {
  LEVELS,
  TACTICS_BY_ID,
  projectEntry,
  tournament,
  tournamentOutlook,
  type CareerState,
  type TournamentResult,
} from '@ttg/engine';
import { useEffect, useState } from 'react';
import { Flag, LevelTag, SurfaceTag } from '../components/Badges';
import { OddsTag } from '../components/Odds';
import { Stamp } from '../components/Stamp';
import { Weather } from '../components/Weather';
import { useContent, useT, useTg, type MessageKey } from '../i18n';
import { money, pct } from '../lib/format';
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
  const nextIndex = season.plan.findIndex((id, i) => i >= season.cursor && id);
  const nextId = season.run?.tournamentId ?? (nextIndex >= 0 ? season.plan[nextIndex] : null);
  const left = season.plan.filter((id, i) => id && i >= season.cursor).length;

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
        {!finished && <p className="label">{t('season.left', { n: left })}</p>}
      </div>

      <Timeline state={state} />

      {finished || !nextId ? (
        <button className="btn btn--ink btn--block" onClick={() => dispatch({ t: 'play' })}>
          {t('season.end')}
        </button>
      ) : (
        <NextStop
          state={state}
          id={nextId}
          auto={auto}
          onPlay={() => dispatch({ t: 'play' })}
          onAuto={() => setAuto((a) => !a)}
        />
      )}

      {latest ? (
        <Protocol state={state} result={latest} />
      ) : (
        <p className="hand empty-note">{t('season.emptyState')}</p>
      )}

      <details className="help-note">
        <summary className="hand">{t('season.help.title')}</summary>
        <ol>
          <li>{t('season.help.1')}</li>
          <li>{t('season.help.2')}</li>
          <li>{t('season.help.3')}</li>
          <li>{t('season.help.4')}</li>
        </ol>
      </details>
    </div>
  );
}

function roundName(t: ReturnType<typeof useT>, label: string): string {
  return ['W', 'F', 'SF', 'QF'].includes(label) ? t(`round.${label}` as MessageKey) : label;
}

/** The next planned tournament with its entry route and odds, plus the play controls. */
function NextStop({
  state,
  id,
  auto,
  onPlay,
  onAuto,
}: {
  state: CareerState;
  id: string;
  auto: boolean;
  onPlay: () => void;
  onAuto: () => void;
}) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const gender = state.config.gender;
  const def = tournament(id);
  const inProgress = state.season.run?.tournamentId === id;
  const outlook = tournamentOutlook(state, def);
  const entry = projectEntry(state, def);
  const closed = outlook.verdict === 'closed' && !inProgress;
  const entryText =
    entry.status === 'wildcard'
      ? t('next.entry.wildcard', { p: pct(entry.wildcard) })
      : entry.status === 'qualifier'
        ? t('next.entry.qualifier', { n: LEVELS[def.level].qualRounds })
        : t(`next.entry.${entry.status}` as MessageKey);

  return (
    <article className="card card--clean next-stop">
      <span className="tape tape--tl tape--blue" />
      <p className="label">{t('next.title')}</p>
      <div className="next-stop__head">
        <Stamp
          city={c(def.city)}
          level={def.level}
          gender={gender}
          surface={def.surface}
          caption={monthOf(def.week, locale)}
          seed={def.id}
          size={80}
        />
        <div className="next-stop__body">
          <h3 className="next-stop__name">{c(def.name)}</h3>
          <p className="row wrap" style={{ gap: 8 }}>
            <LevelTag level={def.level} gender={gender} />
            <SurfaceTag surface={def.surface} />
            {!inProgress && <OddsTag outlook={outlook} gender={gender} />}
          </p>
          {!inProgress && (
            <ul className="next-stop__facts">
              <li>{entryText}</li>
              {!closed && <li>{t('next.field', { opp: outlook.opp, me: outlook.me })}</li>}
              {!closed && (
                <li>
                  <strong>{t('next.first', { p: pct(outlook.first) })}</strong>
                </li>
              )}
              {!closed && outlook.likely && (
                <li>{t('next.likely', { round: roundName(t, outlook.likely) })}</li>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="row wrap">
        <button className="btn btn--ink grow" disabled={auto} onClick={onPlay}>
          {closed ? t('season.nextClosed') : t('season.next')}
        </button>
        <button className={`btn ${auto ? 'btn--hl' : ''}`} onClick={onAuto}>
          {auto ? t('season.stop') : t('season.auto')}
        </button>
      </div>
      <p className="pencil next-stop__hint">{t('season.autoHint')}</p>
    </article>
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
                  <span className="mono pencil"> · OVR {m.oppOvr}</span>
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
      <LossNote state={state} result={result} />
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

/** Why the run ended — the rating gap explains most early exits. */
function LossNote({ state, result }: { state: CareerState; result: TournamentResult }) {
  const tg = useTg();
  const last = result.matches[result.matches.length - 1];
  if (!last || last.won) return null;
  const gap = last.oppOvr - last.meOvr;
  const key =
    gap >= 5 ? 'protocol.why.gap' : gap <= -5 ? 'protocol.why.upset' : 'protocol.why.close';
  return (
    <p className={`hand protocol__why ${gap >= 5 ? 'is-bad' : ''}`}>
      {tg(key, state.config.gender, { opp: last.oppOvr, me: last.meOvr })}
    </p>
  );
}
