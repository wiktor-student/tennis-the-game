import { STAGES } from '@ttg/engine';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Footer } from '../App';
import { ConfirmDialog } from '../components/Dialog';
import { useT } from '../i18n';
import { useGo } from '../lib/nav';
import { SLOT_COUNT, useGame } from '../store/game';
import { useSettings } from '../store/settings';

const COVERS = ['#2f5f9e', '#c4552d', '#2f6b3a'];

export function SlotsScreen() {
  const t = useT();
  const go = useGo();
  const [params] = useSearchParams();
  const daily = params.get('daily') === '1';
  const { slots, refreshSlots, open, removeSlot, newDaily, error } = useGame();
  const locale = useSettings((s) => s.locale);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => refreshSlots(), [refreshSlots]);

  const start = async (slot: number) => {
    if (daily) {
      setBusy(true);
      await newDaily(slot);
      setBusy(false);
      if (!useGame.getState().error) go('/play');
      return;
    }
    go(`/new/${slot}`);
  };

  return (
    <main className="desk">
      <header className="desk__head">
        <button className="link-btn" onClick={() => go('/')}>
          {t('common.back')}
        </button>
        <h1 id="screen-title" tabIndex={-1} className="desk__title">
          {daily ? t('home.daily') : t('slots.title')}
        </h1>
        <p className="desk__sub">{daily ? t('home.dailySub') : t('slots.subtitle')}</p>
        {error === 'daily_already_attempted' && <p className="desk__sub">{t('home.dailyDone')}</p>}
      </header>
      <div className="notebooks">
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const s = slots[i] ?? null;
          return (
            <article
              key={i}
              className="notebook"
              style={{ '--cover': COVERS[i] } as React.CSSProperties}
              data-empty={!s}
            >
              <span className="notebook__band" aria-hidden="true" />
              <div className="notebook__label">
                <span className="label">№ {i + 1}</span>
                {s ? (
                  <>
                    <h2 className="hand notebook__name">{s.name}</h2>
                    <p className="notebook__meta mono">
                      {s.retired
                        ? `${t('slots.retired')} · ${s.legacy}`
                        : `${STAGES[s.stage].name[locale]} · ${s.age} · ${t('slots.season', { n: s.season })}${s.rank ? ` · #${s.rank}` : ''}`}
                      {s.daily && ` · ${t('slots.daily')}`}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="hand notebook__name notebook__name--empty">
                      {t('slots.empty')}
                    </h2>
                    <p className="notebook__meta mono">{t('slots.emptySub')}</p>
                  </>
                )}
              </div>
              <div className="notebook__actions">
                {s && !daily ? (
                  <>
                    <button className="btn btn--hl" onClick={() => open(i) && go('/play')}>
                      {t('slots.continue')}
                    </button>
                    <button className="link-btn notebook__trash" onClick={() => setConfirm(i)}>
                      {t('slots.delete')}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn--hl"
                    disabled={busy || (daily && !!s && !s.retired)}
                    onClick={() => start(i)}
                  >
                    {t('slots.start')}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={t('slots.delete')}
        text={t('slots.deleteConfirm')}
        confirmLabel={t('slots.delete')}
        cancelLabel={t('common.back')}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm !== null) removeSlot(confirm);
          setConfirm(null);
        }}
      />
      <Footer />
    </main>
  );
}
