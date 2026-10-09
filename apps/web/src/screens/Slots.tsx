import { STAGES } from '@ttg/engine';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Footer } from '../App';
import { ConfirmDialog } from '../components/Dialog';
import { Racket } from '../components/Racket';
import { useT } from '../i18n';
import { useGo } from '../lib/nav';
import { SLOT_COUNT, useGame } from '../store/game';
import { useSettings } from '../store/settings';

export function SlotsScreen() {
  const t = useT();
  const go = useGo();
  const [params] = useSearchParams();
  const daily = params.get('daily') === '1';
  const { slots, refreshSlots, open, removeSlot, newDaily, error } = useGame();
  const locale = useSettings((s) => s.locale);
  const racket = useSettings((s) => s.racket);
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
    <main className="shell shell--narrow">
      <div className="panel panel--court stack">
        <div>
          <h1 id="screen-title" tabIndex={-1} className="display screen-title">
            {daily ? t('menu.daily') : t('slots.title')}
          </h1>
          <p className="muted">{t('slots.subtitle')}</p>
        </div>
        {error === 'daily_already_attempted' && (
          <p className="chip chip--down">{t('menu.dailyDone')}</p>
        )}
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const s = slots[i] ?? null;
          return (
            <article key={i} className="slot">
              <div className="slot__head">
                <Racket racketId={racket} size={56} tilt={-30} />
                <div>
                  {s ? (
                    <>
                      <h2 className="slot__name">{s.name}</h2>
                      <p className="slot__meta">
                        {s.retired
                          ? `${t('slots.retired')} · LEGACY ${s.legacy}`
                          : `${STAGES[s.stage].name[locale]} · ${t('hud.age')} ${s.age} · OVR ${s.ovr}${s.rank ? ` · #${s.rank}` : ''} · ${t('hud.season')} ${s.season}`}
                        {s.daily && ` · ${t('slots.daily')}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="slot__name">{t('slots.empty')}</h2>
                      <p className="slot__meta">{t('slots.emptySub')}</p>
                    </>
                  )}
                </div>
              </div>
              {s && !daily ? (
                <div className="row">
                  <button
                    className="btn btn--primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (open(i)) go('/play');
                    }}
                  >
                    {t('slots.continue')} ▸
                  </button>
                  <button className="btn btn--danger" onClick={() => setConfirm(i)}>
                    {t('slots.delete')}
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn--primary btn--block"
                  disabled={busy || (daily && !!s && !s.retired)}
                  onClick={() => start(i)}
                >
                  {t('slots.start')} ▸
                </button>
              )}
            </article>
          );
        })}
      </div>
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 12 }}
        onClick={() => go('/')}
      >
        {t('menu.back')}
      </button>
      <ConfirmDialog
        open={confirm !== null}
        title={t('slots.delete')}
        text={t('slots.deleteConfirm')}
        confirmLabel={t('slots.delete')}
        cancelLabel={t('new.back')}
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
