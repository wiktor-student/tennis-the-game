import { ENGINE_VERSION } from '@ttg/engine';
import { DisplayNameSchema } from '@ttg/shared';
import { useEffect, useState } from 'react';
import { Footer } from '../App';
import { ConfirmDialog } from '../components/Dialog';
import { useT, type MessageKey } from '../i18n';
import { api, apiEnabled, ensureSession } from '../lib/api';
import { useGo } from '../lib/nav';
import { wipeAll } from '../lib/storage';
import { useMeta } from '../store/meta';
import { useSettings, type Locale, type Motion, type Speed } from '../store/settings';

const CHANGELOG: { version: string; pl: string; en: string }[] = [
  {
    version: '1.0.0',
    pl: 'Premiera: kariera od Tenisa 10 po Wielkie Szlemy, Kariera Dnia, rankingi, 48 osiągnięć, kolekcja rakiet.',
    en: 'Launch: careers from Tennis 10 to the Grand Slams, Daily Career, leaderboards, 48 achievements, racket collection.',
  },
];

export function SettingsScreen() {
  const t = useT();
  const go = useGo();
  const settings = useSettings();
  const wipeMeta = useMeta((s) => s.wipe);
  const [name, setName] = useState('');
  const [online, setOnline] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!apiEnabled) return;
    ensureSession().then((ok) => {
      setOnline(ok);
      if (ok)
        api
          .me()
          .then((me) => setName(me.displayName))
          .catch(() => undefined);
    });
  }, []);

  const nameValid = DisplayNameSchema.safeParse(name).success;

  return (
    <main className="shell shell--narrow">
      <h1 id="screen-title" tabIndex={-1} className="display screen-title screen-head">
        {t('settings.title')}
      </h1>
      <div className="stack">
        <Group label={t('settings.motion')}>
          <Segmented<Motion>
            value={settings.motion}
            options={['full', 'reduced', 'none']}
            label={(v) => t(`settings.motion.${v}` as MessageKey)}
            onChange={(motion) => settings.set({ motion })}
          />
        </Group>
        <Group label={t('settings.speed')}>
          <Segmented<Speed>
            value={settings.speed}
            options={['slow', 'normal', 'fast']}
            label={(v) => t(`settings.speed.${v}` as MessageKey)}
            onChange={(speed) => settings.set({ speed })}
          />
        </Group>
        <Group label={t('settings.language')}>
          <Segmented<Locale>
            value={settings.locale}
            options={['pl', 'en']}
            label={(v) => (v === 'pl' ? 'Polski' : 'English')}
            onChange={(locale) => settings.set({ locale })}
          />
        </Group>

        <Group label={t('settings.online')}>
          {online ? (
            <form
              className="name-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!nameValid) return;
                api
                  .updateMe({ displayName: name.trim() })
                  .then(() => setSaved(true))
                  .catch(() => setSaved(false));
              }}
            >
              <label className="field" style={{ flex: 1 }}>
                <span className="eyebrow">{t('settings.profile')}</span>
                <input
                  className="input"
                  value={name}
                  maxLength={24}
                  onChange={(e) => (setName(e.target.value), setSaved(false))}
                />
              </label>
              <button className="btn" disabled={!nameValid}>
                {saved ? '✓' : t('settings.save')}
              </button>
            </form>
          ) : (
            <p className="muted">{t('settings.offline')}</p>
          )}
        </Group>

        <Group label={t('settings.whatsNew')}>
          <ul className="changelog">
            {CHANGELOG.map((e) => (
              <li key={e.version}>
                <strong className="num">v{e.version}</strong> — {e[settings.locale]}
              </li>
            ))}
          </ul>
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            engine {ENGINE_VERSION}
          </p>
        </Group>

        <Group label={t('settings.data')}>
          <button className="btn btn--danger" onClick={() => setConfirm(true)}>
            {t('settings.wipe')}
          </button>
        </Group>
      </div>
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 16 }}
        onClick={() => go('/')}
      >
        {t('menu.back')}
      </button>
      <ConfirmDialog
        open={confirm}
        title={t('settings.wipe')}
        text={t('settings.wipeConfirm')}
        confirmLabel={t('slots.delete')}
        cancelLabel={t('new.back')}
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          wipeAll();
          wipeMeta();
          setConfirm(false);
          go('/');
        }}
      />
      <Footer />
    </main>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="panel stack">
      <h2 className="eyebrow">{label}</h2>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  label,
  onChange,
}: {
  value: T;
  options: T[];
  label: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}>
          {label(o)}
        </button>
      ))}
    </div>
  );
}
