import { LEVELS, SURFACE_INFO, type Gender, type LevelId, type Surface } from '@ttg/engine';
import type { EffectChip } from '../lib/effects';
import { useSettings } from '../store/settings';

const BIG: LevelId[] = ['m1000', 'finals', 'olympics', 'j_slam'];

export function LevelTag({ level, gender }: { level: LevelId; gender: Gender }) {
  const cls = level === 'gs' ? 'tag--gs' : BIG.includes(level) ? 'tag--big' : '';
  return <span className={`tag ${cls}`}>{LEVELS[level].badge[gender]}</span>;
}

export function SurfaceTag({ surface }: { surface: Surface }) {
  const locale = useSettings((s) => s.locale);
  return (
    <span className={`surface surface--${surface}`}>
      <span className="surface__dot" />
      {SURFACE_INFO[surface].short[locale]}
    </span>
  );
}

export function Flag({ nat }: { nat: string }) {
  if (nat === 'PL') return <span className="flag flag--pl" title="Polska" />;
  return <span className="flag mono">{nat}</span>;
}

/** Effects written in pencil: "Psychika +2  ·  −4 tys. zł". */
export function Marks({ chips }: { chips: EffectChip[] }) {
  if (chips.length === 0) return null;
  return (
    <p className="marks">
      {chips.map((c, i) => (
        <span key={i} className={c.tone}>
          {c.text}
        </span>
      ))}
    </p>
  );
}
