import { COACHES, STAGES, juniorStandings, overall, type CareerState } from '@ttg/engine';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Polaroid } from '../components/Polaroid';
import { Radar } from '../components/Radar';
import { Weather } from '../components/Weather';
import { useContent, useT, useTg, type MessageKey } from '../i18n';
import { money } from '../lib/format';
import { useGo } from '../lib/nav';
import {
  CalendarPanel,
  ChroniclePanel,
  DeckPanel,
  MoneyPanel,
  RankingPanel,
} from '../panels/Panels';
import { EventPhase } from '../phases/EventPhase';
import { RetiredPhase } from '../phases/RetiredPhase';
import { SchedulePhase } from '../phases/SchedulePhase';
import { SeasonEndPhase } from '../phases/SeasonEndPhase';
import { SeasonPhase } from '../phases/SeasonPhase';
import { SponsorsPhase } from '../phases/SponsorsPhase';
import { TacticsPhase } from '../phases/TacticsPhase';
import { TeamPhase } from '../phases/TeamPhase';
import { TrainingPhase } from '../phases/TrainingPhase';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

type Tab = 'week' | 'calendar' | 'ranking' | 'money' | 'deck' | 'chronicle';
const TABS: { id: Tab; key: MessageKey }[] = [
  { id: 'week', key: 'tabs.week' },
  { id: 'calendar', key: 'tabs.calendar' },
  { id: 'ranking', key: 'tabs.ranking' },
  { id: 'deck', key: 'tabs.deck' },
  { id: 'money', key: 'tabs.money' },
  { id: 'chronicle', key: 'tabs.chronicle' },
];

export function GameScreen() {
  const career = useGame((s) => s.career);
  const close = useGame((s) => s.close);
  const t = useT();
  const go = useGo();
  const [tab, setTab] = useState<Tab>('week');
  const phase = career?.phase.kind;

  // Anything that needs the player's hand brings the notebook back to "this week".
  useEffect(() => {
    if (phase && phase !== 'season') setTab('week');
  }, [phase]);

  if (!career) return <Navigate to="/slots" replace />;
  const needsAction = career.phase.kind !== 'season';

  return (
    <main className="desk desk--game">
      <nav className="bookmarks" aria-label="Zeszyt">
        {TABS.map(({ id, key }) => (
          <button
            key={id}
            className={`bookmark bookmark--${id}`}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {t(key)}
            {id === 'week' && needsAction && tab !== 'week' && (
              <span className="bookmark__dot" aria-hidden="true" />
            )}
          </button>
        ))}
        <button
          className="bookmark bookmark--close"
          onClick={() => {
            close();
            go('/');
          }}
        >
          {t('tabs.close')}
        </button>
      </nav>
      <div className="open-notebook">
        <IdCard state={career} />
        <section className="page spread__right" aria-live="polite">
          {tab === 'week' && <PhaseView state={career} />}
          {tab === 'calendar' && <CalendarPanel state={career} />}
          {tab === 'ranking' && <RankingPanel state={career} />}
          {tab === 'deck' && <DeckPanel state={career} />}
          {tab === 'money' && <MoneyPanel state={career} />}
          {tab === 'chronicle' && <ChroniclePanel state={career} />}
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
      return <SeasonPhase state={state} />;
    case 'tactics':
      return <TacticsPhase state={state} />;
    case 'season_end':
      return <SeasonEndPhase state={state} />;
    case 'retired':
      return <RetiredPhase state={state} />;
  }
}

/** Left page: the player's ID card. */
function IdCard({ state }: { state: CareerState }) {
  const t = useT();
  const tg = useTg();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const p = state.player;
  const isPro = state.season.stage === 'pro';
  const stage = STAGES[state.season.stage];
  const standing = isPro
    ? state.pro.rank
      ? `#${state.pro.rank}`
      : '—'
    : state.season.started
      ? `${juniorStandings(state).findIndex((r) => r.id === 'P') + 1}.`
      : '—';
  const battery = Math.max(0, 100 - p.fatigue);

  return (
    <aside className="page page--plain idcard" aria-label={t('id.title')}>
      <div className="spread">
        <span className="label">{t('id.title')}</span>
        <span className="label">
          {t('id.season')} {state.history.length + 1} · {state.season.year}
        </span>
      </div>
      <div className="idcard__head">
        <div className="idcard__photo">
          <span className="tape tape--tl" />
          <Polaroid gender={p.gender} age={p.age} caption={`${p.first} ${p.last}`} />
        </div>
        <dl className="idcard__facts">
          <div>
            <dt className="label">{t('id.ovr')}</dt>
            <dd className="idcard__ovr hand">{overall(p.skills)}</dd>
          </div>
          <div>
            <dt className="label">{isPro ? t('id.rank') : t('id.standing')}</dt>
            <dd className="idcard__rank mono">{standing}</dd>
          </div>
          <div>
            <dt className="label">{t('id.age')}</dt>
            <dd className="mono">{p.age}</dd>
          </div>
          <div>
            <dt className="label">{stage.name[locale]}</dt>
            <dd className="idcard__circuit">{stage.circuit[locale]}</dd>
          </div>
        </dl>
      </div>

      <div className="idcard__radar">
        <Radar skills={p.skills} />
      </div>

      <div className="idcard__status">
        <div className="idcard__weather">
          <Weather form={state.season.form} size={46} />
          <div>
            <span className="label">{t('id.form')}</span>
            <p className="hand">{state.season.started ? t(`form.${state.season.form}`) : '—'}</p>
          </div>
        </div>
        <div className="meter-row">
          <span className="label">{t('id.battery')}</span>
          <span className="battery" data-level={battery < 35 ? 'low' : battery < 65 ? 'mid' : 'ok'}>
            <span style={{ width: `${battery}%` }} />
          </span>
          <span className="mono">{Math.round(battery)}%</span>
        </div>
        <div className="meter-row">
          <span className="label">{t('id.mood')}</span>
          <span className="mood">
            <span style={{ width: `${p.morale}%` }} />
          </span>
          <span className="mono">{Math.round(p.morale)}</span>
        </div>
        <p className={`idcard__health hand ${p.injury ? 'is-bad' : ''}`}>
          {p.injury ? t('id.injury', { weeks: p.injury.weeks }) : tg('id.healthy', p.gender)}
        </p>
      </div>

      <div className="idcard__surfaces">
        <span className="label">{t('id.surfaces')}</span>
        <div className="mini-courts">
          {(['clay', 'hard', 'grass'] as const).map((s) => (
            <span key={s} className={`mini-court mini-court--${s}`}>
              <span className="mono">{Math.round(p.surfaces[s])}</span>
            </span>
          ))}
        </div>
      </div>

      <dl className="idcard__table">
        <dt className="label">{t('id.coach')}</dt>
        <dd>{c(COACHES[state.team.coach].name)}</dd>
        <dt className="label">{t('id.hand')}</dt>
        <dd>{p.hand === 'L' ? t('id.handL') : t('id.handR')}</dd>
        <dt className="label">{t('id.height')}</dt>
        <dd>{p.heightRevealed ? `${p.heightCm} cm` : t('id.heightUnknown')}</dd>
        <dt className="label">
          {t('id.media')} / {t('id.rep')}
        </dt>
        <dd className="mono">
          {Math.round(p.media)} / {Math.round(p.reputation)}
        </dd>
        <dt className="label">{t('id.budget')}</dt>
        <dd className={`hand idcard__money ${state.finance.budget < 0 ? 'is-bad' : ''}`}>
          {money(state.finance.budget, locale)}
        </dd>
      </dl>
    </aside>
  );
}
