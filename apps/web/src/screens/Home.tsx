import {
  ACHIEVEMENTS,
  GOAL_TEMPLATES,
  VERDICTS_BY_ID,
  WEEKLY_TEMPLATES,
  warsawDayKey,
} from '@ttg/engine';
import type { Board, DailyResponse, LeaderboardResponse } from '@ttg/shared';
import { useEffect, useState } from 'react';
import { Footer } from '../App';
import { Racket } from '../components/Racket';
import { useContent, useT } from '../i18n';
import { api, apiEnabled, ensureSession } from '../lib/api';
import { timeLeft } from '../lib/format';
import { useGo } from '../lib/nav';
import { currentStreak, localGoals, useMeta } from '../store/meta';
import { useSettings } from '../store/settings';

const BOARDS: { board: Board; key: 'board.daily' | 'board.today' | 'board.week' }[] = [
  { board: 'today', key: 'board.today' },
  { board: 'week', key: 'board.week' },
  { board: 'daily', key: 'board.daily' },
];

export function HomeScreen() {
  const t = useT();
  const c = useContent();
  const go = useGo();
  const meta = useMeta();
  const racket = useSettings((s) => s.racket);
  const locale = useSettings((s) => s.locale);
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [boards, setBoards] = useState<Partial<Record<Board, LeaderboardResponse>>>({});
  const [online, setOnline] = useState<boolean | null>(apiEnabled ? null : false);
  const [board, setBoard] = useState<Board>('today');

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
      for (const { board: b } of BOARDS) {
        api
          .leaderboard(b)
          .then((res) => !cancelled && setBoards((prev) => ({ ...prev, [b]: res })))
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
  const weeklyT = WEEKLY_TEMPLATES.find((w) => w.id === weekly.templateId);
  const dailyUsed = daily?.attempted ?? meta.dailyAttempted === warsawDayKey();
  const streak = currentStreak(meta);
  const left = timeLeft(daily?.secondsLeft ?? secondsToMidnight());
  const lastOwner = meta.museum[0]?.summary.name;

  return (
    <main className="desk">
      <div className="desk__grid">
        <section className="cover" aria-labelledby="screen-title">
          <span className="cover__band" aria-hidden="true" />
          <div className="cover__label">
            <h1 id="screen-title" tabIndex={-1} className="cover__title">
              {t('app.title')}
            </h1>
            <p className="cover__owner">
              <span className="label">{t('home.owner')}</span>
              <span className="hand">{lastOwner ?? t('home.ownerBlank')}</span>
            </p>
          </div>
          <p className="cover__tagline">{t('app.tagline')}</p>
          <div className="cover__racket" aria-hidden="true">
            <Racket racketId={racket} size={170} tilt={24} />
          </div>
          <div className="cover__actions">
            <button className="btn btn--hl btn--block" onClick={() => go('/slots')}>
              {t('home.open')}
            </button>
            <button
              className="btn btn--block cover__daily"
              disabled={dailyUsed}
              onClick={() => go('/slots?daily=1')}
            >
              <span>{t('home.daily')}</span>
              <small>{dailyUsed ? t('home.dailyDone') : t('home.dailySub')}</small>
            </button>
          </div>
        </section>

        <aside className="notes">
          <div className="sticky">
            <div className="spread">
              <h2 className="hand notes__title">{t('home.todo')}</h2>
              <span className="label">{t('home.left', { h: left.h, m: left.m })}</span>
            </div>
            <ul className="todo">
              {goals.map((g) => {
                const tpl = GOAL_TEMPLATES.find((x) => x.id === g.templateId);
                if (!tpl) return null;
                const progress =
                  tpl.unit === 'rank'
                    ? g.value >= 9999
                      ? '—'
                      : `#${g.value}`
                    : `${Math.min(g.value, g.target)}/${g.target}`;
                return (
                  <li key={g.key} data-done={g.done}>
                    <span className="todo__box" aria-hidden="true">
                      {g.done ? '✓' : ''}
                    </span>
                    <span className="todo__text">{c(tpl.description, 'M', { x: g.target })}</span>
                    <span className="todo__progress mono">{progress}</span>
                  </li>
                );
              })}
            </ul>
            <p className="notes__streak">
              <span className="label">{t('home.streak')}</span>{' '}
              <span className="hand">
                {streak === 1 ? t('common.day1') : t('common.days', { n: streak })}
              </span>
            </p>
          </div>
          {weeklyT && (
            <div className="sticky sticky--peach" data-done={weekly.done}>
              <span className="label">{t('home.weekly')}</span>
              <strong className="hand notes__weekly">{weeklyT.name[locale]}</strong>
              <p className="notes__desc">{weeklyT.description[locale]}</p>
            </div>
          )}
        </aside>

        <section className="page page--plain pinned" aria-labelledby="board-title">
          <span className="pin" aria-hidden="true" />
          <h2 id="board-title" className="title" style={{ fontSize: '1.9rem' }}>
            {t('home.board')}
          </h2>
          {online === false ? (
            <p className="pencil">{t('board.offline')}</p>
          ) : (
            <>
              <div className="board-tabs" role="tablist">
                {BOARDS.map(({ board: b, key }) => (
                  <button
                    key={b}
                    role="tab"
                    aria-selected={board === b}
                    onClick={() => setBoard(b)}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
              <BoardSheet data={boards[board] ?? null} />
            </>
          )}
        </section>

        <nav className="index-cards" aria-label="Menu">
          <IndexCard
            title={t('home.cabinet')}
            sub={t('home.cabinetSub', {
              n: Object.keys(meta.achievements).length,
              total: ACHIEVEMENTS.length,
            })}
            onClick={() => go('/achievements')}
            tape=""
          />
          <IndexCard
            title={t('home.chronicle')}
            sub={t('home.chronicleSub')}
            onClick={() => go('/museum')}
            tape="blue"
          />
          <IndexCard
            title={t('home.rackets')}
            sub={t('home.racketsSub')}
            onClick={() => go('/rackets')}
            tape="pink"
          />
          <IndexCard
            title={t('home.settings')}
            sub={t('home.settingsSub')}
            onClick={() => go('/settings')}
            tape=""
          />
        </nav>
      </div>
      <Footer />
    </main>
  );
}

function IndexCard({
  title,
  sub,
  onClick,
  tape,
}: {
  title: string;
  sub: string;
  onClick: () => void;
  tape: string;
}) {
  return (
    <button className="card index-card" onClick={onClick}>
      <span className={`tape tape--tl ${tape ? `tape--${tape}` : ''}`} />
      <span className="index-card__title">{title}</span>
      <span className="index-card__sub">{sub}</span>
    </button>
  );
}

function secondsToMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.floor((end.getTime() - now.getTime()) / 1000);
}

function BoardSheet({ data }: { data: LeaderboardResponse | null }) {
  const t = useT();
  const c = useContent();
  if (!data) return <div className="board-loading" aria-busy="true" />;
  return (
    <div>
      {data.reigning && (
        <p className="hand board-reigning">
          {t('board.reigning', { name: data.reigning.name, legacy: data.reigning.legacy })}
        </p>
      )}
      {data.entries.length === 0 ? (
        <p className="pencil">{t('board.empty')}</p>
      ) : (
        <table className="sheet">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('board.player')}</th>
              <th className="r">{t('board.legacy')}</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e) => {
              const verdict = VERDICTS_BY_ID[e.verdict];
              return (
                <tr key={e.careerId} className={e.isMe ? 'is-me' : ''}>
                  <td className="mono">{e.position}.</td>
                  <td>
                    <strong className="board-name">{e.name}</strong>
                    <span className="board-meta">
                      {e.owner}
                      {verdict ? ` · ${c(verdict.title, e.gender)}` : ''}
                    </span>
                  </td>
                  <td className="r hand board-legacy">{e.legacy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
