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
    <main className="desk">
      <header className="desk__head">
        <button className="link-btn" onClick={() => go('/')}>
          {t('common.back')}
        </button>
        <h1 id="screen-title" tabIndex={-1} className="desk__title">
          {t('rackets.title')}
        </h1>
      </header>
      <ul className="rack">
        {RACKETS.map((r) => {
          const ach = r.unlock ? ACHIEVEMENTS.find((a) => a.id === r.unlock) : null;
          const available = !r.unlock || !!unlocked[r.unlock];
          return (
            <li
              key={r.id}
              className="rack__item"
              data-locked={!available}
              data-selected={selected === r.id}
            >
              <Racket racketId={r.id} size={150} tilt={0} />
              <span className="card card--clean rack__tag">
                <strong className="hand">{c(r.name)}</strong>
                {available ? (
                  <button
                    className={`btn btn--sm ${selected === r.id ? 'btn--hl' : ''}`}
                    onClick={() => set({ racket: r.id })}
                  >
                    {selected === r.id ? t('rackets.selected') : t('rackets.select')}
                  </button>
                ) : (
                  <span className="pencil rack__lock">
                    {t('rackets.unlock', { name: ach ? c(ach.name) : '?' })}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <Footer />
    </main>
  );
}
