import {
  BACKGROUNDS,
  COACHES,
  DIFFICULTIES,
  SKILL_IDS,
  SKILL_INFO,
  STAGES,
  displayName,
  juniorStandings,
  overall,
  type CareerState,
} from '@ttg/engine';
import { Navigate } from 'react-router-dom';
import { Flag } from '../components/Badges';
import { Racket } from '../components/Racket';
import { useContent, useT } from '../i18n';
import { money } from '../lib/format';
import { useGo } from '../lib/nav';
import { EventPhase } from '../phases/EventPhase';
import { RetiredPhase } from '../phases/RetiredPhase';
import { SchedulePhase } from '../phases/SchedulePhase';
import { SeasonEndPhase } from '../phases/SeasonEndPhase';
import { SeasonPhase } from '../phases/SeasonPhase';
import { SponsorsPhase } from '../phases/SponsorsPhase';
import { TeamPhase } from '../phases/TeamPhase';
import { TrainingPhase } from '../phases/TrainingPhase';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function GameScreen() {
  const career = useGame((s) => s.career);
  if (!career) return <Navigate to="/slots" replace />;
  return (
    <main className="shell game">
      <Hud state={career} />
      <Stepper state={career} />
      <div className="game-grid">
        <Sidebar state={career} />
        <section className="game-main" aria-live="polite">
          <PhaseView state={career} />
        </section>
      </div>
    </main>
  );
}

function PhaseView({ state }: { state: CareerState }) {
  switch (state.phase.kind) {
    case 'event':
      return <EventPhase state={state} />;
    case 'training':
      return <TrainingPhase state={state} />;
    case 'team':
      return <TeamPhase state={state} />;
    case 'sponsors':
      return <SponsorsPhase state={state} />;
    case 'schedule':
      return <SchedulePhase state={state} />;
    case 'season':
    case 'decision':
      return <SeasonPhase state={state} />;
    case 'season_end':
      return <SeasonEndPhase state={state} />;
    case 'retired':
      return <RetiredPhase state={state} />;
  }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function Hud({ state }: { state: CareerState }) {
  const t = useT();
  const go = useGo();
  const close = useGame((s) => s.close);
  const locale = useSettings((s) => s.locale);
  const p = state.player;
  const isPro = state.season.stage === 'pro';
  const stage = STAGES[state.season.stage];
  const standing = isPro ? state.pro.rank : null;
  const juniorPos = !isPro ? juniorStandings(state).findIndex((r) => r.id === 'P') + 1 : null;

  return (
    <header className="hud">
      <div className="hud__ovr" title="OVR">
        <span className="hud__ovr-value num">{overall(p.skills)}</span>
        <span className="hud__ovr-label">OVR</span>
      </div>
      <div className="hud__who">
        <h1 id="screen-title" tabIndex={-1} className="hud__name">
          {p.first} {p.last}
        </h1>
        <p className="hud__circuit">
          {stage.name[locale]} · {stage.circuit[locale]} · {COACHES[state.team.coach].name[locale]}
        </p>
      </div>
      <dl className="hud__stats">
        <Stat label={t('hud.budget')} value={money(state.finance.budget, locale, false)} tone={state.finance.budget < 0 ? 'down' : undefined} />
        <Stat label={t('hud.age')} value={String(p.age)} />
        <Stat label={t('hud.media')} value={String(Math.round(p.media))} />
        <Stat label={t('hud.rep')} value={String(Math.round(p.reputation))} />
        <Stat
          label={isPro ? t('hud.rank') : t('hud.standing')}
          value={isPro ? (standing ? `#${standing}` : '—') : state.season.started ? `P${juniorPos}` : '—'}
        />
      </dl>
      <div className="hud__season">
        <span className="eyebrow">{t('hud.season')}</span>
        <span className="hud__season-value num">{state.history.length + 1}</span>
      </div>
      <button
        className="btn btn--sm btn--ghost hud__menu"
        onClick={() => {
          close();
          go('/');
        }}
      >
        {t('hud.saveExit')}
      </button>
    </header>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'down' }) {
  return (
    <div className="hud__stat" data-tone={tone}>
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

const STEPS = ['event', 'training', 'team', 'sponsors', 'schedule', 'season'] as const;

function Stepper({ state }: { state: CareerState }) {
  const kind = state.phase.kind;
  const current =
    kind === 'decision' || kind === 'season_end' || kind === 'retired'
      ? 5
      : kind === 'event' && state.phase.event.context === 'midseason'
        ? 5
        : STEPS.indexOf(kind as (typeof STEPS)[number]);
  return (
    <div className="stepper" aria-hidden="true">
      {STEPS.map((s, i) => (
        <span key={s} className="stepper__bar" data-state={i < current ? 'done' : i === current ? 'now' : 'todo'} />
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const racket = useSettings((s) => s.racket);
  const p = state.player;
  const coach = COACHES[state.team.coach];

  return (
    <aside className="sidebar">
      <section className="panel">
        <h2 className="eyebrow panel__title">{t('side.skills')}</h2>
        {SKILL_IDS.map((id) => (
          <div key={id} className="skill">
            <span>{SKILL_INFO[id].short[locale]}</span>
            <span className="skill__bar">
              <span className="skill__fill" style={{ width: `${p.skills[id]}%` }} />
            </span>
            <span className="skill__value">{Math.round(p.skills[id])}</span>
          </div>
        ))}
        <h3 className="eyebrow" style={{ marginTop: 14, marginBottom: 6 }}>
          {t('side.surfaces')}
        </h3>
        <div className="surfaces">
          {(['clay', 'hard', 'grass'] as const).map((s) => (
            <span key={s} className={`surface-pill surface-pill--${s}`}>
              <span className={`surface-dot surface-dot--${s}`} />
              <span className="num">{Math.round(p.surfaces[s])}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="eyebrow panel__title">{t('side.condition')}</h2>
        <Meter label={t('side.fatigue')} value={p.fatigue} tone="warn" />
        <Meter label={t('side.morale')} value={p.morale} tone="ok" />
        <p className="side-line">
          {p.injury ? (
            <span className="chip chip--down">{t('side.injury', { weeks: p.injury.weeks })}</span>
          ) : (
            <span className="chip chip--up">{t('side.healthy')}</span>
          )}
          {state.season.started && <span className="chip">{t(`form.${state.season.form}`)}</span>}
        </p>
      </section>

      <section className="panel team-card">
        <h2 className="eyebrow panel__title">{t('side.team')}</h2>
        <div className="team-card__body">
          <Racket racketId={racket} size={92} />
          <div>
            <strong className="team-card__coach">{c(coach.name)}</strong>
            <p className="muted team-card__desc">{c(coach.description)}</p>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {state.team.physio && <span className="chip">{t('side.physio')}</span>}
              {state.team.fitnessCoach && <span className="chip">{t('side.fitnessCoach')}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="eyebrow panel__title">{t('side.profile')}</h2>
        <dl className="kv">
          <dt>{t('side.start')}</dt>
          <dd>{BACKGROUNDS[state.config.background].name[locale]}</dd>
          <dt>{t('side.level')}</dt>
          <dd>{DIFFICULTIES[state.config.difficulty].name[locale]}</dd>
          <dt>{t('side.hand')}</dt>
          <dd>{p.hand === 'L' ? t('side.handL') : t('side.handR')}</dd>
          <dt>{t('side.height')}</dt>
          <dd>{p.heightRevealed ? `${p.heightCm} cm` : t('side.heightUnknown')}</dd>
        </dl>
      </section>

      <BudgetPanel state={state} />
      {state.season.stage === 'pro' ? <RankingPanel state={state} /> : <StandingsPanel state={state} />}
    </aside>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <span className={`meter__bar meter__bar--${tone}`}>
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
      <span className="num">{Math.round(value)}</span>
    </div>
  );
}

function BudgetPanel({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const ledger = state.finance.ledger.slice(-6);
  return (
    <section className="panel">
      <h2 className="eyebrow panel__title">{t('side.budget')}</h2>
      <p className={`budget-total num ${state.finance.budget < 0 ? 'is-negative' : ''}`}>{money(state.finance.budget, locale)}</p>
      {ledger.length > 0 && (
        <ul className="ledger">
          {ledger.map((e, i) => (
            <li key={i}>
              <span>{c(e.label)}</span>
              <span className={`num ${e.amount < 0 ? 'is-negative' : 'is-positive'}`}>
                {e.amount > 0 ? '+' : ''}
                {money(e.amount, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StandingsPanel({ state }: { state: CareerState }) {
  const t = useT();
  const table = juniorStandings(state);
  const meIndex = table.findIndex((r) => r.id === 'P');
  const rows = table.slice(0, 3).map((r, i) => ({ ...r, pos: i + 1 }));
  if (meIndex >= 3) rows.push({ ...table[meIndex]!, pos: meIndex + 1 });
  const byId = new Map(state.field.map((a) => [a.id, a]));
  return (
    <section className="panel">
      <h2 className="eyebrow panel__title">{t('side.standings')}</h2>
      <table className="table">
        <tbody>
          {rows.map((r) => {
            const ai = byId.get(r.id);
            return (
              <tr key={r.id} className={r.id === 'P' ? 'is-me' : ''}>
                <td className={`pos pos--${r.pos}`}>P{r.pos}</td>
                <td>
                  {r.id === 'P' ? `${state.player.first} ${state.player.last}` : ai ? displayName(ai) : '—'}
                  {ai?.nemesis && <span className="nemesis-tag">N</span>}
                </td>
                <td className="r num">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function RankingPanel({ state }: { state: CareerState }) {
  const t = useT();
  const ranked = state.field.filter((a) => a.rank !== null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const myRank = state.pro.rank;
  const top = ranked.slice(0, 3);
  const near = myRank && myRank > 4 ? ranked.filter((a) => a.rank === myRank - 1 || a.rank === myRank + 1) : [];
  type Row = { key: string; pos: number | null; name: string; nat: string; points: number; me: boolean; nemesis: boolean };
  const rows: Row[] = top.map((a) => ({ key: a.id, pos: a.rank, name: displayName(a), nat: a.nat, points: a.points, me: false, nemesis: !!a.nemesis }));
  const me: Row = { key: 'P', pos: myRank, name: `${state.player.first} ${state.player.last}`, nat: 'PL', points: state.pro.points, me: true, nemesis: false };
  if (myRank && myRank <= 3) rows.splice(myRank - 1, 0, me);
  else {
    const before = near.filter((a) => (a.rank ?? 0) < (myRank ?? 0));
    const after = near.filter((a) => (a.rank ?? 0) > (myRank ?? 0));
    for (const a of before) rows.push({ key: a.id, pos: a.rank, name: displayName(a), nat: a.nat, points: a.points, me: false, nemesis: !!a.nemesis });
    rows.push(me);
    for (const a of after) rows.push({ key: a.id, pos: a.rank, name: displayName(a), nat: a.nat, points: a.points, me: false, nemesis: !!a.nemesis });
  }
  return (
    <section className="panel">
      <h2 className="eyebrow panel__title">
        {t('side.ranking')} {state.config.gender === 'M' ? 'ATP' : 'WTA'}
      </h2>
      <table className="table">
        <tbody>
          {rows.slice(0, 6).map((r) => (
            <tr key={r.key} className={r.me ? 'is-me' : ''}>
              <td className={`pos pos--${r.pos ?? 0}`}>{r.pos ?? '—'}</td>
              <td>
                <Flag nat={r.nat} /> {r.name}
                {r.nemesis && <span className="nemesis-tag">N</span>}
              </td>
              <td className="r num">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
