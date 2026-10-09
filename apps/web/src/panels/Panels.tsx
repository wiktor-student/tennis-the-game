import {
  COACHES,
  STAGES,
  TACTICS,
  displayName,
  juniorStandings,
  masteryLevel,
  tacticEdge,
  tournament,
  type CareerState,
} from '@ttg/engine';
import { Flag } from '../components/Badges';
import { Stamp } from '../components/Stamp';
import { TacticCard } from '../components/TacticCard';
import { useContent, useT } from '../i18n';
import { money } from '../lib/format';
import { useSettings } from '../store/settings';

export const MONTHS_PL = [
  'STY',
  'LUT',
  'MAR',
  'KWI',
  'MAJ',
  'CZE',
  'LIP',
  'SIE',
  'WRZ',
  'PAŹ',
  'LIS',
  'GRU',
];
export const MONTHS_EN = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export function monthOf(week: number, locale: 'pl' | 'en'): string {
  const list = locale === 'pl' ? MONTHS_PL : MONTHS_EN;
  return list[Math.min(11, Math.floor((week - 1) / 4.35))] as string;
}

export function resultShort(label: string): string {
  if (label === 'DNE') return '—';
  if (label === 'INJ') return '✚';
  return label;
}

/** Terminarz — this season's planned tournaments as stamps; played ones are inked with the result. */
export function CalendarPanel({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const season = state.season;
  const results = new Map(season.results.map((r) => [r.tournamentId, r]));
  const planned = season.slots
    .map((slot, i) => ({ slot, id: season.plan[i] ?? null }))
    .filter((x): x is { slot: (typeof season.slots)[number]; id: string } => x.id !== null);

  return (
    <div className="stack">
      <h2 className="title">{t('schedule.title', { year: season.year })}</h2>
      {planned.length === 0 && <p className="pencil">—</p>}
      <div className="stamp-grid">
        {planned.map(({ slot, id }) => {
          const def = tournament(id);
          const r = results.get(id);
          return (
            <div key={id} className="stamp-cell">
              <Stamp
                city={c(def.city)}
                level={def.level}
                gender={state.config.gender}
                surface={def.surface}
                caption={monthOf(slot.week, locale)}
                inked={!!r}
                seed={id}
                result={r ? resultShort(r.label) : null}
              />
              <span className="stamp-cell__name">{c(def.name)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RankingPanel({ state }: { state: CareerState }) {
  const t = useT();
  const isPro = state.season.stage === 'pro';
  const me = `${state.player.first} ${state.player.last}`;
  type Row = {
    key: string;
    pos: number | null;
    name: string;
    nat: string;
    points: number;
    me: boolean;
    nemesis: boolean;
  };
  let rows: Row[];
  if (isPro) {
    const ranked = state.field
      .filter((a) => a.rank !== null)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    const all: Row[] = ranked.map((a) => ({
      key: a.id,
      pos: a.rank,
      name: displayName(a),
      nat: a.nat,
      points: a.points,
      me: false,
      nemesis: !!a.nemesis,
    }));
    const mine: Row = {
      key: 'P',
      pos: state.pro.rank,
      name: me,
      nat: 'PL',
      points: state.pro.points,
      me: true,
      nemesis: false,
    };
    const myRank = state.pro.rank ?? 99_999;
    const top = all.slice(0, 10);
    const around = all.filter((r) => Math.abs((r.pos ?? 0) - myRank) <= 3 && (r.pos ?? 0) > 10);
    rows = [...top, ...around];
    rows.push(mine);
    rows.sort((a, b) => (a.pos ?? 99_999) - (b.pos ?? 99_999));
  } else {
    const byId = new Map(state.field.map((a) => [a.id, a]));
    rows = juniorStandings(state).map((r, i) => {
      const ai = byId.get(r.id);
      return {
        key: r.id,
        pos: i + 1,
        name: r.id === 'P' ? me : ai ? displayName(ai) : '—',
        nat: r.id === 'P' ? 'PL' : (ai?.nat ?? ''),
        points: r.points,
        me: r.id === 'P',
        nemesis: !!ai?.nemesis,
      };
    });
  }
  return (
    <div className="stack">
      <h2 className="title">
        {isPro
          ? t('ranking.pro', { tour: state.config.gender === 'M' ? 'ATP' : 'WTA' })
          : t('ranking.junior')}
      </h2>
      <table className="sheet">
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className={r.me ? 'is-me' : ''}>
              <td className="mono" style={{ width: 52 }}>
                {r.pos ?? '—'}
                {i > 0 && rows[i - 1] && (rows[i - 1]!.pos ?? 0) + 1 < (r.pos ?? 0) ? (
                  <span className="pencil"> ⋮</span>
                ) : null}
              </td>
              <td>
                <Flag nat={r.nat} /> {r.name}
                {r.nemesis && <span className="nemesis">Nemesis</span>}
              </td>
              <td className="r mono">
                {r.points} {t('ranking.points')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DeckPanel({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const neutral = { style: 'allround' as const };
  return (
    <div className="stack">
      <h2 className="title">{t('tactic.deck')}</h2>
      <div className="hand-grid">
        {state.tactics.owned.map((id) => {
          const rec = state.tactics.record[id] ?? { played: 0, won: 0 };
          return (
            <div key={id} className="deck-slot">
              <TacticCard
                view={{
                  ...tacticEdge(state, id, neutral, 'hard'),
                  mastery: masteryLevel(state, id),
                }}
              />
              <p className="mono deck-slot__rec">
                {t('tactic.record', { won: rec.won, lost: rec.played - rec.won })}
                {state.tactics.preferred === id && (
                  <span className="hl"> · {t('tactic.preferred')}</span>
                )}
              </p>
            </div>
          );
        })}
      </div>
      <h3 className="label">{t('tactic.collection')}</h3>
      <ul className="locked-cards">
        {TACTICS.filter((x) => !state.tactics.owned.includes(x.id)).map((x) => (
          <li key={x.id}>
            <strong>{c(x.name)}</strong>
            <span className="pencil">
              {' '}
              — {t('tactic.locked', { coach: x.teacher ? c(COACHES[x.teacher].name) : '—' })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MoneyPanel({ state }: { state: CareerState }) {
  const t = useT();
  const c = useContent();
  const locale = useSettings((s) => s.locale);
  const ledger = state.finance.ledger;
  return (
    <div className="stack">
      <h2 className="title">{t('money.title')}</h2>
      <p className={`hand money-total ${state.finance.budget < 0 ? 'is-bad' : ''}`}>
        {money(state.finance.budget, locale)}
      </p>
      <h3 className="label">{t('money.ledger')}</h3>
      {ledger.length === 0 ? (
        <p className="pencil">{t('money.empty')}</p>
      ) : (
        <table className="sheet ledger">
          <tbody>
            {ledger.map((e, i) => (
              <tr key={i}>
                <td>{c(e.label)}</td>
                <td className={`r mono ${e.amount < 0 ? 'is-bad' : 'is-good'}`}>
                  {e.amount > 0 ? '+' : ''}
                  {money(e.amount, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {state.sponsors.length > 0 && (
        <>
          <h3 className="label">{t('money.sponsors')}</h3>
          <ul className="locked-cards">
            {state.sponsors.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong> <span className="mono">{money(s.amount, locale)}</span>{' '}
                <span className="pencil">· {t('sponsors.seasons', { n: s.seasonsLeft })}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ChroniclePanel({ state }: { state: CareerState }) {
  const t = useT();
  const locale = useSettings((s) => s.locale);
  return (
    <div className="stack">
      <h2 className="title">{t('chronicle.title')}</h2>
      {state.history.length === 0 ? (
        <p className="pencil">{t('chronicle.empty')}</p>
      ) : (
        <table className="sheet">
          <thead>
            <tr>
              <th>{t('chronicle.season')}</th>
              <th>{t('chronicle.age')}</th>
              <th>{t('chronicle.stage')}</th>
              <th className="r">{t('chronicle.rank')}</th>
              <th className="r">{t('chronicle.titles')}</th>
              <th className="r">{t('chronicle.legacy')}</th>
            </tr>
          </thead>
          <tbody>
            {[...state.history].reverse().map((h) => (
              <tr key={h.year}>
                <td className="mono">{h.year}</td>
                <td className="mono">{h.age}</td>
                <td>{STAGES[h.stage].name[locale]}</td>
                <td className="r mono">
                  {h.rankEnd === null ? '—' : h.stage === 'pro' ? `#${h.rankEnd}` : `${h.rankEnd}.`}
                </td>
                <td className="r hand">{h.titles.length || ''}</td>
                <td className="r mono">{h.legacyAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
