import {
  ACHIEVEMENTS,
  GOAL_TEMPLATES,
  WEEKLY_TEMPLATES,
  VERDICTS_BY_ID,
  warsawDayKey,
} from '@ttg/engine';
import type { Board, DailyResponse, LeaderboardResponse } from '@ttg/shared';
import { useEffect, useState } from 'react';
import { Footer } from '../App';
import { CourtArt } from '../components/CourtArt';
import { useContent, useT } from '../i18n';
import { api, apiEnabled, ensureSession } from '../lib/api';
import { timeLeft } from '../lib/format';
import { useGo } from '../lib/nav';
import { currentStreak, localGoals, useMeta } from '../store/meta';
import { useSettings } from '../store/settings';

const BOARDS: { board: Board; key: 'board.daily' | 'board.today' | 'board.week' }[] = [
  { board: 'daily', key: 'board.daily' },
  { board: 'today', key: 'board.today' },
  { board: 'week', key: 'board.week' },
];

export function HomeScreen() {
  const t = useT();
  const go = useGo();
  const meta = useMeta();
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [boards, setBoards] = useState<Partial<Record<Board, LeaderboardResponse>>>({});
  const [online, setOnline] = useState<boolean | null>(apiEnabled ? null : false);

  useEffect(() => {
    if (!apiEnabled) return;
    let cancelled = false;
    (async () => {
      const ok = await ensureSession();
      if (cancelled) return;
      setOnline(ok);
      if (!ok) return;
      api
        .daily()
        .then((d) => !cancelled && setDaily(d))
        .catch(() => undefined);
      for (const { board } of BOARDS) {
        api
          .leaderboard(board)
          .then((res) => !cancelled && setBoards((b) => ({ ...b, [board]: res })))
          .catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const local = localGoals(meta.museum);
  const goals = daily?.goals ?? local.goals;
  const weekly = daily?.weekly ?? local.weekly;
  const goalsDone = goals.filter((g) => g.done).length;
  const dailyUsed = daily?.attempted ?? meta.dailyAttempted === warsawDayKey();
  const streak = currentStreak(meta);
  const achieved = Object.keys(meta.achievements).length;

  return (
    <main className="shell">
      <header className="hero">
        <CourtArt />
        <div className="hero__text">
          <h1 id="screen-title" tabIndex={-1} className="hero__title">
            <span>{t('app.titleTop')}</span>
            <span>{t('app.titleBottom')}</span>
          </h1>
          <p className="hero__tagline serif">{t('app.tagline')}</p>
        </div>
      </header>

      <div className="home-grid">
        <section className="stack" aria-label="Menu">
          <button className="tile tile--play" onClick={() => go('/slots')}>
            <span className="tile__title">{t('menu.play')}</span>
            <span className="tile__sub">{t('menu.playSub')}</span>
          </button>
          <div className="tile-row">
            <button className="tile" disabled={dailyUsed} onClick={() => go('/slots?daily=1')}>
              <span className="tile__title">{t('menu.daily')}</span>
              <span className="tile__sub">
                {dailyUsed ? t('menu.dailyDone') : t('menu.dailySub')}
              </span>
            </button>
            <div className="tile tile--stat">
              <span className="eyebrow">{t('menu.streak')}</span>
              <span className="tile__big num">
                {streak === 1 ? t('common.day1') : t('common.days', { n: streak })}
              </span>
            </div>
            <div className="tile tile--stat">
              <span className="eyebrow">{t('menu.goals')}</span>
              <span className="tile__big num">
                {goalsDone}/{goals.length}
              </span>
            </div>
          </div>

          <Goals goals={goals} weekly={weekly} secondsLeft={daily?.secondsLeft ?? null} />

          <div className="tile-grid">
            <button className="tile" onClick={() => go('/achievements')}>
              <span className="tile__title">{t('menu.achievements')}</span>
              <span className="tile__sub">
                {t('menu.achievementsSub', { n: achieved, total: ACHIEVEMENTS.length })}
              </span>
            </button>
            <button className="tile" onClick={() => go('/museum')}>
              <span className="tile__title">{t('menu.museum')}</span>
              <span className="tile__sub">{t('menu.museumSub')}</span>
            </button>
            <button className="tile" onClick={() => go('/rackets')}>
              <span className="tile__title">{t('menu.rackets')}</span>
              <span className="tile__sub">{t('menu.racketsSub')}</span>
            </button>
            <button className="tile" onClick={() => go('/settings')}>
              <span className="tile__title">{t('menu.settings')}</span>
              <span className="tile__sub">{t('menu.settingsSub')}</span>
            </button>
          </div>
        </section>

        <section className="stack" aria-label="Rankingi">
          {online === false && <p className="panel muted">{t('board.offline')}</p>}
          {online !== false &&
            BOARDS.map(({ board, key }) => (
              <BoardTable key={board} title={t(key)} data={boards[board] ?? null} />
            ))}
        </section>
      </div>
      <Footer />
    </main>
  );
}

function Goals({
  goals,
  weekly,
  secondsLeft,
}: {
  goals: { key: string; templateId: string; target: number; value: number; done: boolean }[];
  weekly: { templateId: string; done: boolean };
  secondsLeft: number | null;
}) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const left = timeLeft(secondsLeft ?? secondsToMidnight());
  const weeklyT = WEEKLY_TEMPLATES.find((w) => w.id === weekly.templateId);
  return (
    <div className="panel goals">
      <div className="spread">
        <span className="eyebrow">{t('goal.daily')}</span>
        <span className="eyebrow">{t('goal.left', { h: left.h, m: left.m })}</span>
      </div>
      <ul className="goals__list">
        {goals.map((g) => {
          const tpl = GOAL_TEMPLATES.find((x) => x.id === g.templateId);
          if (!tpl) return null;
          const progress = tpl.unit === 'rank' ? (g.done ? 1 : 0) : Math.min(1, g.value / g.target);
          return (
            <li key={g.key} className="goal" data-done={g.done}>
              <div className="spread">
                <strong className="goal__name">{c(tpl.name)}</strong>
                <span className="num muted">
                  {tpl.unit === 'rank'
                    ? g.done
                      ? '✓'
                      : g.value >= 9999
                        ? '—'
                        : `#${g.value}`
                    : `${Math.min(g.value, g.target)}/${g.target}`}
                </span>
              </div>
              <span className="goal__desc">{c(tpl.description, 'M', { x: g.target })}</span>
              <span className="goal__bar">
                <span style={{ width: `${progress * 100}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
      {weeklyT && (
        <div className="goal goal--weekly" data-done={weekly.done}>
          <span className="eyebrow">{t('goal.weekly')}</span>
          <strong className="goal__name">{weeklyT.name[locale]}</strong>
          <span className="goal__desc">{weeklyT.description[locale]}</span>
        </div>
      )}
    </div>
  );
}

function secondsToMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.floor((end.getTime() - now.getTime()) / 1000);
}

function BoardTable({ title, data }: { title: string; data: LeaderboardResponse | null }) {
  const t = useT();
  const locale = useSettings((s) => s.locale);
  return (
    <div className="panel board">
      <h2 className="eyebrow">{title}</h2>
      {data?.reigning && (
        <p className="board__reigning">
          {t('board.reigning', { name: data.reigning.name, legacy: data.reigning.legacy })}
        </p>
      )}
      {data && data.entries.length === 0 && (
        <p className="muted board__empty">{t('board.empty')}</p>
      )}
      {data && data.entries.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('board.player')}</th>
              <th className="r">{t('board.legacy')}</th>
              <th className="r">{t('board.seasons')}</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e) => (
              <tr key={e.careerId} className={e.isMe ? 'is-me' : ''}>
                <td className={`pos pos--${e.position}`}>{e.position}</td>
                <td>
                  <span className="board__name">{e.name}</span>
                  <span className="board__meta">
                    {e.owner} · {VERDICTS_BY_ID[e.verdict]?.title[locale] ?? ''}
                  </span>
                </td>
                <td className="r num board__legacy">{e.legacy}</td>
                <td className="r num muted">{e.seasons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!data && <div className="board__loading" aria-busy="true" />}
    </div>
  );
}
