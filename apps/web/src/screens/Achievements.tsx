import { ACHIEVEMENTS } from '@ttg/engine';
import { Footer } from '../App';
import { useContent, useT } from '../i18n';
import { useGo } from '../lib/nav';
import { useMeta } from '../store/meta';
import { useSettings } from '../store/settings';

export function AchievementsScreen() {
  const t = useT();
  const c = useContent();
  const go = useGo();
  const unlocked = useMeta((s) => s.achievements);
  const locale = useSettings((s) => s.locale);
  const count = Object.keys(unlocked).length;

  return (
    <main className="shell">
      <div className="spread screen-head">
        <h1 id="screen-title" tabIndex={-1} className="display screen-title">
          {t('ach.title')}
        </h1>
        <span className="num muted">
          {count}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <ul className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id];
          const hidden = a.secret && !at;
          return (
            <li key={a.id} className={`ach ach--${a.tier}`} data-unlocked={!!at}>
              <span className="ach__medal" aria-hidden="true" />
              <div>
                <strong className="ach__name">{hidden ? t('ach.secret') : c(a.name)}</strong>
                <p className="ach__desc">{hidden ? '???' : c(a.description)}</p>
                <p className="ach__date">{at ? new Date(at).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB') : t('ach.locked')}</p>
              </div>
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
