import {
  SITUATIONS_BY_ID,
  tournament,
  type CareerState,
  type FormId,
  type PendingDecision,
  type PlayedMatch,
  type TournamentResult,
} from '@ttg/engine';
import { useEffect, useRef, useState } from 'react';
import { Flag, LevelBadge, SurfaceDot } from '../components/Badges';
import { ChanceBar, Roulette } from '../components/Roulette';
import { useContent, useT, type MessageKey } from '../i18n';
import { money, pct, signed } from '../lib/format';
import { useGame } from '../store/game';
import { simDelay, useSettings } from '../store/settings';

export function SeasonPhase({ state }: { state: CareerState }) {
  const t = useT();
  const dispatch = useGame((s) => s.dispatch);
  const speed = useSettings((s) => s.speed);
  const [auto, setAuto] = useState(false);
  const season = state.season;
  const deciding = state.phase.kind === 'decision';
  const finished = season.cursor >= season.slots.length && !season.run;

  // Auto-simulation: one tournament per tick until something needs the player.
  useEffect(() => {
    if (!auto || state.phase.kind !== 'season') return;
    const id = setTimeout(() => dispatch({ t: 'play' }), simDelay(speed));
    return () => clearTimeout(id);
  }, [auto, state, dispatch, speed]);

  useEffect(() => {
    if (state.phase.kind !== 'season') setAuto(false);
  }, [state.phase.kind]);

  const skip = () => {
    // Instant: play until a decision, event or the end of the season.
    for (let i = 0; i < 80; i++) {
      const s = useGame.getState().career;
      if (!s || s.phase.kind !== 'season') break;
      dispatch({ t: 'play' });
    }
  };

  const latest = season.results[season.results.length - 1] ?? null;

  return (
    <div className="stack">
      <div className="panel panel--court">
        <div className="spread season-head">
          <div>
            <h2 className="phase-title">{t('season.report', { n: state.history.length + 1, year: season.year })}</h2>
            <FormLine form={season.form} fresh={season.results.length === 0} />
          </div>
          <div className="row season-controls">
            {!deciding && finished && (
              <button className="btn btn--primary" onClick={() => dispatch({ t: 'play' })}>
                {t('season.summary')}
              </button>
            )}
            {!deciding && !finished && (
              <>
                <button className="btn btn--primary" disabled={auto} onClick={() => dispatch({ t: 'play' })}>
                  {t('season.play')}
                </button>
                <button className="btn" onClick={() => setAuto((a) => !a)}>
                  {auto ? t('season.stop') : t('season.auto')}
                </button>
                <button className="btn btn--ghost" disabled={auto} onClick={skip}>
                  {t('season.skip')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {state.phase.kind === 'decision' && (
        <DecisionPanel
          key={`${state.phase.decision.round}-${state.phase.decision.oppName}-${state.phase.decision.scoreText}`}
          state={state}
          decision={state.phase.decision}
        />
      )}

      {latest && !deciding && <ResultCard state={state} result={latest} />}

      <Roadmap state={state} />
    </div>
  );
}

function FormLine({ form, fresh }: { form: FormId; fresh: boolean }) {
  const t = useT();
  const motion = useSettings((s) => s.motion);
  const forms: FormId[] = ['normal', 'weak', 'crisis', 'life', 'great', 'good', 'normal', 'weak', 'great', 'good'];
  const [spinning, setSpinning] = useState(fresh && motion === 'full');
  useEffect(() => {
    if (!spinning) return;
    const id = setTimeout(() => setSpinning(false), 1400);
    return () => clearTimeout(id);
  }, [spinning]);
  return (
    <p className="form-line">
      <span className="eyebrow">{t('season.form')}</span>
      <span className={`form-reel form-reel--${form}`} data-spinning={spinning}>
        {spinning ? (
          <span className="form-reel__track">
            {[...forms, form].map((f, i) => (
              <span key={i}>{t(`form.${f}`)}</span>
            ))}
          </span>
        ) : (
          t(`form.${form}`)
        )}
      </span>
    </p>
  );
}

// ─── Decision ────────────────────────────────────────────────────────────────

function DecisionPanel({ state, decision }: { state: CareerState; decision: PendingDecision }) {
  const t = useT();
  const c = useContent();
  const dispatch = useGame((s) => s.dispatch);
  const [revealed, setRevealed] = useState(false);
  const situation = SITUATIONS_BY_ID[decision.situationId];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gender = state.config.gender;
  const vars = { opp: decision.oppName, score: decision.scoreText };

  // Focus the situation for keyboard and screen-reader users when it appears.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!situation) return null;
  const resolved = decision.resolved;
  const chosen = resolved ? situation.options[resolved.option] : null;
  const chosenView = resolved ? decision.options[resolved.option] : null;

  return (
    <section className="panel decision" data-resolved={!!resolved}>
      <p className="eyebrow decision__meta">{t('decision.round', { round: decision.round, opp: decision.oppName, score: decision.scoreText || '—' })}</p>
      <h3 ref={headingRef} tabIndex={-1} className="narrative decision__text">
        {c(situation.text, gender, vars)}
      </h3>

      {!resolved && (
        <div className="decision__options">
          {situation.options.map((opt, i) => {
            const view = decision.options[i]!;
            return (
              <button key={i} className="option" data-risky={view.risky} onClick={() => dispatch({ t: 'choose', option: i })}>
                <span className="option__head">
                  <span className="option__label">{c(opt.label, gender)}</span>
                  {view.risky && <span className="option__risk">{t('decision.risky')}</span>}
                </span>
                <span className="option__desc">{c(opt.desc, gender)}</span>
                <span className="option__chance">
                  <ChanceBar option={view} />
                  <span className="num">{t('phase.chance', { p: pct(view.chance) })}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {resolved && chosen && chosenView && (
        <div className="decision__result stack">
          <p className="decision__chosen">▸ {c(chosen.label, gender)}</p>
          <Roulette option={chosenView} roll={resolved.roll} outcome={resolved.outcome} onDone={() => setRevealed(true)} />
          <div className="legend">
            <span className="legend__super">{pct(chosenView.superChance)}% {t('decision.super')}</span>
            <span className="legend__success">
              {pct(chosenView.chance - chosenView.superChance)}% {t('decision.success')}
            </span>
            <span className="legend__fail">
              {100 - pct(chosenView.chance)}% {t('decision.fail')}
            </span>
          </div>
          {revealed && (
            <div className={`verdict-line verdict-line--${resolved.outcome}`}>
              <strong className="display">{t(`decision.outcome.${resolved.outcome}` as MessageKey)}</strong>
              <p className="narrative">{c(chosen.result[resolved.outcome], gender, vars)}</p>
              <p className="muted">{t('decision.momentum', { m: signed(resolved.momentum * 100, 1) })}</p>
              <button className="btn btn--primary btn--block" onClick={() => dispatch({ t: 'continue' })}>
                {t('phase.next')}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Results ─────────────────────────────────────────────────────────────────

function resultLabel(t: ReturnType<typeof useT>, r: TournamentResult): string {
  if (r.label === 'DNE') return t('season.notEntered');
  if (r.label === 'INJ') return t('season.injured');
  if (r.label.startsWith('Q')) return r.label;
  const key = `round.${r.label}` as MessageKey;
  return ['W', 'F', 'SF', 'QF', 'RR', 'BRONZE'].includes(r.label) ? t(key) : r.label;
}

function ResultCard({ state, result }: { state: CareerState; result: TournamentResult }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const def = tournament(result.tournamentId);
  const champion = result.reached === 0;
  return (
    <article className={`panel result-card ${champion ? 'result-card--title' : ''}`} data-surface={def.surface}>
      <div className="spread">
        <span className="eyebrow">{t('season.latest')}</span>
        <span className="row" style={{ gap: 8 }}>
          <SurfaceDot surface={def.surface} />
          <LevelBadge level={def.level} gender={state.config.gender} />
        </span>
      </div>
      <h3 className="result-card__name">{c(def.name)}</h3>
      <p className="muted">
        {c(def.city)}
        {result.entry === 'qualifier' && ` · ${t('season.entry.qualifier')}`}
        {result.entry === 'wildcard' && ` · ${t('season.entry.wildcard')}`}
        {result.entry === 'exempt' && ` · ${t('season.entry.exempt')}`}
      </p>
      <div className="result-card__outcome">
        <span className={`result-tag result-tag--${result.reached === 0 ? 'w' : result.reached !== null && result.reached <= 2 ? 'deep' : 'out'}`}>
          {result.medal ? t(`medal.${result.medal}` as MessageKey) : resultLabel(t, result)}
        </span>
        {result.points > 0 && <span className="chip">{t('season.points', { n: result.points })}</span>}
        {result.prize > 0 && <span className="chip chip--up">+{money(result.prize, locale)}</span>}
        {result.rankAfter && <span className="chip">#{result.rankAfter}</span>}
      </div>
      <MatchList matches={result.matches} />
      {result.championName && result.reached !== 0 && <p className="muted result-card__champ">{t('season.champion', { name: result.championName })}</p>}
    </article>
  );
}

function MatchList({ matches }: { matches: PlayedMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <ol className="matches">
      {matches.map((m, i) => (
        <li key={i} className={`match ${m.won ? 'match--won' : 'match--lost'}`}>
          <span className="match__round">{m.round}</span>
          <span className="match__opp">
            <Flag nat={m.oppNat} /> {m.oppName}
            {m.oppSeed && <small className="muted"> [{m.oppSeed}]</small>}
            {m.oppRank && <small className="muted"> #{m.oppRank}</small>}
            {m.nemesis && <span className="nemesis-tag">N</span>}
          </span>
          <span className="match__score num">{m.scoreText}</span>
          <span className="match__wl">{m.won ? 'W' : 'L'}</span>
        </li>
      ))}
    </ol>
  );
}

function Roadmap({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const [open, setOpen] = useState<string | null>(null);
  const season = state.season;
  const results = new Map(season.results.map((r) => [r.tournamentId, r]));
  const rows = season.slots
    .map((slot, i) => ({ slot, i, id: season.plan[i] ?? null }))
    .filter((r) => r.id !== null) as { slot: (typeof season.slots)[number]; i: number; id: string }[];

  return (
    <section className="panel">
      <h3 className="eyebrow panel__title">{t('season.roadmap')}</h3>
      <ol className="roadmap">
        {rows.map(({ i, id }, n) => {
          const def = tournament(id);
          const r = results.get(id);
          const isNext = !r && i >= season.cursor && rows.findIndex((x) => x.i >= season.cursor && !results.get(x.id)) === n;
          const expanded = open === id;
          return (
            <li key={id} className="roadmap__row" data-state={r ? 'done' : isNext ? 'next' : 'todo'}>
              <button className="roadmap__line" aria-expanded={expanded} disabled={!r || r.matches.length === 0} onClick={() => setOpen(expanded ? null : id)}>
                <span className="roadmap__n num">R{n + 1}</span>
                <SurfaceDot surface={def.surface} />
                <span className="roadmap__name">{c(def.name)}</span>
                <LevelBadge level={def.level} gender={state.config.gender} />
                <span className={`roadmap__result ${r?.reached === 0 ? 'is-title' : ''}`}>{r ? resultLabel(t, r) : '–'}</span>
                <span className="roadmap__pts num">{r && r.points > 0 ? r.points : ''}</span>
              </button>
              {expanded && r && <MatchList matches={r.matches} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
