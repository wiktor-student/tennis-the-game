import { BACKGROUNDS, VERDICTS_BY_ID } from '@ttg/engine';
import type { ProgressResponse } from '@ttg/shared';
import { useEffect, useState } from 'react';
import { Footer } from '../App';
import { useContent, useT } from '../i18n';
import { api, apiEnabled, ensureSession } from '../lib/api';
import { money } from '../lib/format';
import { useGo } from '../lib/nav';
import { useMeta } from '../store/meta';
import { useSettings } from '../store/settings';

export function MuseumScreen() {
  const t = useT();
  const c = useContent();
  const go = useGo();
  const museum = useMeta((s) => s.museum);
  const locale = useSettings((s) => s.locale);
  const [server, setServer] = useState<ProgressResponse | null>(null);

  useEffect(() => {
    if (!apiEnabled) return;
    ensureSession().then((ok) => {
      if (ok)
        api
          .progress()
          .then(setServer)
          .catch(() => undefined);
    });
  }, []);

  const summaries = museum.map((m) => m.summary);
  const rankable = summaries.filter((s) => s.rankable);
  const records = [
    { label: t('museum.bestLegacy'), value: String(Math.max(0, ...rankable.map((s) => s.legacy))) },
    {
      label: t('museum.mostSlams'),
      value: String(Math.max(0, ...summaries.map((s) => s.slamTitles))),
    },
    {
      label: t('museum.bestRank'),
      value: (() => {
        const best = summaries.map((s) => s.peakRank).filter((x): x is number => x !== null);
        return best.length ? `#${Math.min(...best)}` : '—';
      })(),
    },
    {
      label: t('museum.richest'),
      value: money(Math.max(0, ...summaries.map((s) => s.prizeMoney)), locale),
    },
    { label: t('museum.careers'), value: String(summaries.length) },
  ];

  return (
    <main className="shell">
      <h1 id="screen-title" tabIndex={-1} className="display screen-title screen-head">
        {t('museum.title')}
      </h1>
      {museum.length === 0 ? (
        <p className="panel muted serif">{t('museum.empty')}</p>
      ) : (
        <div className="stack">
          <section className="panel">
            <h2 className="eyebrow panel__title">{t('museum.records')}</h2>
            <dl className="stat-grid">
              {records.map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd className="num">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {server && server.trophies.length > 0 && (
            <section className="panel">
              <h2 className="eyebrow panel__title">{t('museum.trophies')}</h2>
              <ul className="trophies">
                {server.trophies.map((tr) => (
                  <li key={`${tr.board}-${tr.periodKey}`} className="trophy">
                    <span className="trophy__cup" aria-hidden="true" />
                    <strong>{tr.name}</strong>
                    <span className="muted">
                      {tr.board} · {tr.periodKey} · LEGACY {tr.legacy}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel">
            <h2 className="eyebrow panel__title">{t('museum.history')}</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('board.player')}</th>
                  <th>{t('retired.verdict')}</th>
                  <th className="r">{t('retired.stats.peak')}</th>
                  <th className="r">GS</th>
                  <th className="r">LEGACY</th>
                </tr>
              </thead>
              <tbody>
                {museum.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="board__name">{m.summary.name}</span>
                      <span className="board__meta">
                        {BACKGROUNDS[m.summary.background].name[locale]} · {m.day}
                        {m.summary.mode === 'daily' && ` · ${t('menu.daily')}`}
                      </span>
                    </td>
                    <td>
                      {VERDICTS_BY_ID[m.summary.verdict]
                        ? c(VERDICTS_BY_ID[m.summary.verdict]!.title, m.summary.gender)
                        : ''}
                    </td>
                    <td className="r num">{m.summary.peakRank ? `#${m.summary.peakRank}` : '—'}</td>
                    <td className="r num">{m.summary.slamTitles}</td>
                    <td className="r num board__legacy">{m.summary.legacy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 16 }}
        onClick={() => go('/')}
      >
        {t('menu.back')}
      </button>
      <Footer />
    </main>
  );
}
