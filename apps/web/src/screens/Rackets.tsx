import { ACHIEVEMENTS, RACKETS } from '@ttg/engine';
import { Footer } from '../App';
import { Racket } from '../components/Racket';
import { useContent, useT } from '../i18n';
import { useGo } from '../lib/nav';
import { useMeta } from '../store/meta';
import { useSettings } from '../store/settings';

export function RacketsScreen() {
  const t = useT();
  const c = useContent();
  const go = useGo();
  const unlocked = useMeta((s) => s.achievements);
  const selected = useSettings((s) => s.racket);
  const set = useSettings((s) => s.set);

  return (
    <main className="shell">
      <h1 id="screen-title" tabIndex={-1} className="display screen-title screen-head">
        {t('rackets.title')}
      </h1>
      <ul className="racket-grid">
        {RACKETS.map((r) => {
          const ach = r.unlock ? ACHIEVEMENTS.find((a) => a.id === r.unlock) : null;
          const available = !r.unlock || !!unlocked[r.unlock];
          return (
            <li key={r.id} className="racket-card" data-locked={!available} data-selected={selected === r.id}>
              <Racket racketId={r.id} size={140} tilt={-12} />
              <strong className="racket-card__name">{c(r.name)}</strong>
              {available ? (
                <button className={`btn btn--sm ${selected === r.id ? 'btn--primary' : ''}`} onClick={() => set({ racket: r.id })}>
                  {selected === r.id ? t('rackets.selected') : t('rackets.select')}
                </button>
              ) : (
                <span className="muted racket-card__lock">{t('rackets.unlock', { name: ach ? c(ach.name) : '?' })}</span>
              )}
            </li>
          );
        })}
      </ul>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 16 }} onClick={() => go('/')}>
        {t('menu.back')}
      </button>
      <Footer />
    </main>
  );
}
