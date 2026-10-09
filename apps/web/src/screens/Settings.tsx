import { ENGINE_VERSION } from '@ttg/engine';
import { DisplayNameSchema } from '@ttg/shared';
import { useEffect, useState, type ReactNode } from 'react';
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
    version: '2.0.0',
    pl: 'Zeszyt Tenisisty: nowy wygląd, talia taktyk z raportem skauta, trening blokowy, kronika i hasło w encyklopedii.',
    en: 'The Tennis Notebook: new look, tactic deck with scouting reports, block training, chronicle and encyclopaedia entry.',
  },
  {
    version: '1.0.0',
    pl: 'Pierwsza wersja: kariera od Tenisa 10 po Wielkie Szlemy, rankingi online.',
    en: 'First version: careers from Tennis 10 to the Grand Slams, online rankings.',
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
    <main className="desk">
      <header className="desk__head">
        <button className="link-btn" onClick={() => go('/')}>
          {t('common.back')}
        </button>
        <h1 id="screen-title" tabIndex={-1} className="desk__title">
          {t('settings.title')}
        </h1>
      </header>
      <div className="page settings">
        <Row label={t('settings.language')}>
          <Choice<Locale>
            value={settings.locale}
            options={['pl', 'en']}
            label={(v) => (v === 'pl' ? 'polski' : 'English')}
            onChange={(locale) => settings.set({ locale })}
          />
        </Row>
        <Row label={t('settings.motion')}>
          <Choice<Motion>
            value={settings.motion}
            options={['full', 'reduced', 'none']}
            label={(v) => t(`settings.motion.${v}` as MessageKey)}
            onChange={(motion) => settings.set({ motion })}
          />
        </Row>
        <Row label={t('settings.speed')}>
          <Choice<Speed>
            value={settings.speed}
            options={['slow', 'normal', 'fast']}
            label={(v) => t(`settings.speed.${v}` as MessageKey)}
            onChange={(speed) => settings.set({ speed })}
          />
        </Row>
        <Row label={t('settings.online')}>
          {online ? (
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!nameValid) return;
                api
                  .updateMe({ displayName: name.trim() })
                  .then(() => setSaved(true))
                  .catch(() => setSaved(false));
              }}
            >
              <label className="grow">
                <span className="visually-hidden">{t('settings.profile')}</span>
                <input
                  className="line-input"
                  value={name}
                  maxLength={24}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              <button className="btn btn--sm" disabled={!nameValid}>
                {saved ? '✓' : t('settings.save')}
              </button>
            </form>
          ) : (
            <p className="pencil">{t('settings.offline')}</p>
          )}
        </Row>
        <Row label={t('settings.whatsNew')}>
          <ul className="changelog">
            {CHANGELOG.map((e) => (
              <li key={e.version}>
                <span className="mono">v{e.version}</span> — {e[settings.locale]}
              </li>
            ))}
          </ul>
          <p className="mono pencil" style={{ fontSize: '0.75rem' }}>
            engine {ENGINE_VERSION}
          </p>
        </Row>
        <Row label={t('settings.data')}>
          <button className="btn btn--sm btn--danger" onClick={() => setConfirm(true)}>
            {t('settings.wipe')}
          </button>
        </Row>
      </div>
      <ConfirmDialog
        open={confirm}
        title={t('settings.wipe')}
        text={t('settings.wipeConfirm')}
        confirmLabel={t('slots.delete')}
        cancelLabel={t('common.back')}
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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="settings__row">
      <h2 className="label">{label}</h2>
      <div>{children}</div>
    </section>
  );
}

function Choice<T extends string>({
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
    <div className="row wrap" role="radiogroup">
      {options.map((o) => (
        <label key={o} className="tick">
          <input type="radio" checked={value === o} onChange={() => onChange(o)} />
          <span>{label(o)}</span>
        </label>
      ))}
    </div>
  );
}
