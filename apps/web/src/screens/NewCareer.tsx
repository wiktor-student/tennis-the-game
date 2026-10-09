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
  const mult = (x: number) => `×${x.toFixed(2).replace('.', locale === 'pl' ? ',' : '.')}`;

  return (
    <main className="desk">
      <header className="desk__head">
        <button className="link-btn" onClick={() => go('/slots')}>
          {t('common.back')}
        </button>
      </header>
      <form
        className="page registration"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !busy) void start();
        }}
      >
        <span className="tape tape--tr" />
        <p className="label">PZT · {new Date().getFullYear()}</p>
        <h1 id="screen-title" tabIndex={-1} className="title">
          {t('new.title')}
        </h1>
        <p className="pencil">{t('new.lead')}</p>

        <div className="registration__names">
          <label className="field">
            <span className="label">{t('new.first')}</span>
            <input
              className="line-input"
              value={name.first}
              maxLength={24}
              onChange={(e) => setName({ ...name, first: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="label">{t('new.last')}</span>
            <input
              className="line-input"
              value={name.last}
              maxLength={32}
              onChange={(e) => setName({ ...name, last: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="link-btn"
            onClick={() => setName(suggestName(randomSeed(), gender))}
          >
            {t('new.random')}
          </button>
        </div>

        <fieldset className="registration__group">
          <legend className="label">{t('new.tour')}</legend>
          <div className="row wrap">
            <label className="tick">
              <input
                type="radio"
                name="tour"
                checked={gender === 'M'}
                onChange={() => pickGender('M')}
              />
              <span>{t('new.boy')}</span>
            </label>
            <label className="tick">
              <input
                type="radio"
                name="tour"
                checked={gender === 'F'}
                onChange={() => pickGender('F')}
              />
              <span>{t('new.girl')}</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="registration__group">
          <legend className="label">{t('new.start')}</legend>
          <div className="registration__grid">
            {Object.values(BACKGROUNDS).map((b) => (
              <button
                key={b.id}
                type="button"
                className="pick"
                aria-pressed={background === b.id}
                onClick={() => setBackground(b.id)}
              >
                <span className="pick__title">{b.name[locale]}</span>
                <span className="pick__meta">{b.description[locale]}</span>
                <span className="mono registration__mult">
                  {t('new.score')} {b.multiplier === null ? t('new.unranked') : mult(b.multiplier)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="registration__group">
          <legend className="label">{t('new.difficulty')}</legend>
          <div className="registration__grid registration__grid--two">
            {Object.values(DIFFICULTIES).map((d) => (
              <button
                key={d.id}
                type="button"
                className="pick"
                aria-pressed={difficulty === d.id}
                onClick={() => setDifficulty(d.id)}
              >
                <span className="pick__title">{d.name[locale]}</span>
                <span className="pick__meta">{d.description[locale]}</span>
                <span className="mono registration__mult">
                  {t('new.score')} {mult(d.multiplier)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <p className="hand registration__family">{t('new.family')}</p>
        <button type="submit" className="btn btn--ink btn--block" disabled={!valid || busy}>
          {t('new.go')}
        </button>
      </form>
      <Footer />
    </main>
  );
}
