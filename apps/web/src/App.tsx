import { ENGINE_VERSION } from '@ttg/engine';
import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useT } from './i18n';
import { AchievementsScreen } from './screens/Achievements';
import { GameScreen } from './screens/Game';
import { HomeScreen } from './screens/Home';
import { MuseumScreen } from './screens/Museum';
import { NewCareerScreen } from './screens/NewCareer';
import { RacketsScreen } from './screens/Rackets';
import { SettingsScreen } from './screens/Settings';
import { SlotsScreen } from './screens/Slots';
import { useSettings } from './store/settings';

export function App() {
  const motion = useSettings((s) => s.motion);
  const locale = useSettings((s) => s.locale);
  const t = useT();

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
    document.documentElement.lang = locale;
    document.title = t('app.title');
  }, [motion, locale, t]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/slots" element={<SlotsScreen />} />
        <Route path="/new/:slot" element={<NewCareerScreen />} />
        <Route path="/play" element={<GameScreen />} />
        <Route path="/achievements" element={<AchievementsScreen />} />
        <Route path="/museum" element={<MuseumScreen />} />
        <Route path="/rackets" element={<RacketsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export function Footer() {
  const t = useT();
  return (
    <footer className="footer">
      <p>{t('app.disclaimer')}</p>
      <p>
        {t('app.title')} v{ENGINE_VERSION} · {t('app.footer')}
      </p>
    </footer>
  );
}
