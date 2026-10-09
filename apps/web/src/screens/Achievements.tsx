import { ACHIEVEMENTS, type AchievementDef } from '@ttg/engine';
import { Footer } from '../App';
import { useContent, useT } from '../i18n';
import { useGo } from '../lib/nav';
import { useMeta } from '../store/meta';
import { useSettings } from '../store/settings';

const SHELVES: AchievementDef['tier'][] = ['legend', 'gold', 'silver', 'bronze'];

/** Trophy cabinet: medals on wooden shelves, empty spots for what is still to win. */
export function AchievementsScreen() {
  const t = useT();
  const c = useContent();
  const go = useGo();
  const unlocked = useMeta((s) => s.achievements);
  const locale = useSettings((s) => s.locale);
  const count = Object.keys(unlocked).length;

  return (
    <main className="desk">
      <header className="desk__head">
        <button className="link-btn" onClick={() => go('/')}>
          {t('common.back')}
        </button>
        <h1 id="screen-title" tabIndex={-1} className="desk__title">
          {t('ach.title')}
        </h1>
        <p className="desk__sub mono">
          {count} / {ACHIEVEMENTS.length}
        </p>
      </header>
      <div className="cabinet">
        {SHELVES.map((tier) => (
          <section key={tier} className="shelf">
            <ul className="shelf__items">
              {ACHIEVEMENTS.filter((a) => a.tier === tier).map((a) => {
                const at = unlocked[a.id];
                const hidden = a.secret && !at;
                return (
                  <li key={a.id} className={`trophy trophy--${a.tier}`} data-unlocked={!!at}>
                    <span className="trophy__disc" aria-hidden="true" />
                    <span className="trophy__plate">
                      <strong>{hidden ? t('ach.secret') : c(a.name)}</strong>
                      <span>{hidden ? '' : c(a.description)}</span>
                      <span className="mono">
                        {at
                          ? new Date(at).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB')
                          : t('ach.locked')}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <span className="shelf__board" aria-hidden="true" />
          </section>
        ))}
      </div>
      <Footer />
    </main>
  );
}
