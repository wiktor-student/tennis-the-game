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
  const peaks = summaries.map((s) => s.peakRank).filter((x): x is number => x !== null);
  const records = [
    {
      label: t('museum.bestLegacy'),
      value: String(Math.max(0, ...summaries.filter((s) => s.rankable).map((s) => s.legacy))),
    },
    {
      label: t('museum.mostSlams'),
      value: String(Math.max(0, ...summaries.map((s) => s.slamTitles))),
    },
    { label: t('museum.bestRank'), value: peaks.length ? `#${Math.min(...peaks)}` : '—' },
    {
      label: t('museum.richest'),
      value: money(Math.max(0, ...summaries.map((s) => s.prizeMoney)), locale),
    },
    { label: t('museum.careers'), value: String(summaries.length) },
  ];

  return (
    <main className="desk">
      <header className="desk__head">
        <button className="link-btn" onClick={() => go('/')}>
          {t('common.back')}
        </button>
        <h1 id="screen-title" tabIndex={-1} className="desk__title">
          {t('museum.title')}
        </h1>
      </header>
      <div className="page page--lined chronicle">
        {museum.length === 0 ? (
          <p className="hand">{t('museum.empty')}</p>
        ) : (
          <div className="stack">
            <h2 className="label">{t('museum.records')}</h2>
            <dl className="notes-grid">
              {records.map((r) => (
                <div key={r.label}>
                  <dt className="label">{r.label}</dt>
                  <dd className="hand">{r.value}</dd>
                </div>
              ))}
            </dl>
            {server && server.trophies.length > 0 && (
              <>
                <h2 className="label">{t('museum.trophies')}</h2>
                <ul className="locked-cards">
                  {server.trophies.map((tr) => (
                    <li key={`${tr.board}-${tr.periodKey}`}>
                      <strong>{tr.name}</strong>{' '}
                      <span className="mono pencil">
                        {tr.periodKey} · {tr.legacy}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h2 className="label">{t('museum.history')}</h2>
            <table className="sheet">
              <tbody>
                {museum.map((m) => {
                  const v = VERDICTS_BY_ID[m.summary.verdict];
                  return (
                    <tr key={m.id}>
                      <td>
                        <strong className="hand" style={{ fontSize: '1.4rem' }}>
                          {m.summary.name}
                        </strong>
                        <span className="board-meta">
                          {BACKGROUNDS[m.summary.background].name[locale]} · {m.day}
                          {v ? ` · ${c(v.title, m.summary.gender)}` : ''}
                        </span>
                      </td>
                      <td className="mono r">
                        {m.summary.peakRank ? `#${m.summary.peakRank}` : '—'}
                      </td>
                      <td className="hand r board-legacy">{m.summary.legacy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
