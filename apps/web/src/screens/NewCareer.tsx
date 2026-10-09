import {
  BACKGROUNDS,
  DIFFICULTIES,
  suggestName,
  type BackgroundId,
  type DifficultyId,
  type Gender,
} from '@ttg/engine';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Footer } from '../App';
import { useT } from '../i18n';
import { useGo } from '../lib/nav';
import { useGame } from '../store/game';
import { useSettings } from '../store/settings';

const randomSeed = () => Math.random().toString(36).slice(2);

export function NewCareerScreen() {
  const t = useT();
  const go = useGo();
  const { slot } = useParams();
  const locale = useSettings((s) => s.locale);
  const newCareer = useGame((s) => s.newCareer);
  const [gender, setGender] = useState<Gender>('M');
  const [name, setName] = useState(() => suggestName(randomSeed(), 'M'));
  const [background, setBackground] = useState<BackgroundId>('wall');
  const [difficulty, setDifficulty] = useState<DifficultyId>('normal');
  const [busy, setBusy] = useState(false);

  const pickGender = (g: Gender) => {
    setGender(g);
    setName(suggestName(randomSeed(), g));
  };

  const start = async () => {
    setBusy(true);
    await newCareer(Number(slot), { name, gender, background, difficulty, mode: 'normal' });
    go('/play');
  };

  const valid = name.first.trim().length > 0 && name.last.trim().length > 0;

  return (
    <main className="shell shell--narrow">
      <div className="panel panel--court stack">
        <h1 id="screen-title" tabIndex={-1} className="display screen-title">
          {t('new.title')}
        </h1>

        <fieldset className="fieldset">
          <legend className="eyebrow">{t('new.name')}</legend>
          <div className="name-row">
            <label className="field">
              <span className="visually-hidden">{t('new.first')}</span>
              <input className="input" value={name.first} maxLength={24} onChange={(e) => setName({ ...name, first: e.target.value })} />
            </label>
            <label className="field">
              <span className="visually-hidden">{t('new.last')}</span>
              <input className="input" value={name.last} maxLength={32} onChange={(e) => setName({ ...name, last: e.target.value })} />
            </label>
            <button className="btn" type="button" onClick={() => setName(suggestName(randomSeed(), gender))}>
              {t('new.random')}
            </button>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="eyebrow">{t('new.tour')}</legend>
          <div className="segmented">
            <button type="button" aria-pressed={gender === 'M'} onClick={() => pickGender('M')}>
              {t('new.boy')}
            </button>
            <button type="button" aria-pressed={gender === 'F'} onClick={() => pickGender('F')}>
              {t('new.girl')}
            </button>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="eyebrow">{t('new.start')}</legend>
          <div className="choices">
            {Object.values(BACKGROUNDS).map((b) => (
              <button key={b.id} type="button" className="choice" aria-pressed={background === b.id} onClick={() => setBackground(b.id)}>
                <span className="choice__title">{b.name[locale]}</span>
                <span className={`score-tag ${b.multiplier === null ? 'score-tag--off' : ''}`}>
                  <small>{t('new.score')}</small>
                  {b.multiplier === null ? t('new.unranked') : `×${b.multiplier.toFixed(1).replace('.', locale === 'pl' ? ',' : '.')}`}
                </span>
                <span className="choice__meta">{b.description[locale]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="eyebrow">{t('new.difficulty')}</legend>
          <div className="choices">
            {Object.values(DIFFICULTIES).map((d) => (
              <button key={d.id} type="button" className="choice" aria-pressed={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                <span className="choice__title">{d.name[locale]}</span>
                <span className="score-tag">
                  <small>{t('new.score')}</small>×{d.multiplier.toFixed(2).replace('.', locale === 'pl' ? ',' : '.')}
                </span>
                <span className="choice__meta">{d.description[locale]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <p className="muted serif" style={{ fontStyle: 'italic' }}>
          {t('new.family')}
        </p>
        <button className="btn btn--primary btn--block" disabled={!valid || busy} onClick={start}>
          {t('new.go')}
        </button>
      </div>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 12 }} onClick={() => go('/slots')}>
        {t('new.back')}
      </button>
      <Footer />
    </main>
  );
}
