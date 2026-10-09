import { LEVELS, SURFACE_INFO, type Gender, type LevelId, type Surface } from '@ttg/engine';
import { useSettings } from '../store/settings';

export function LevelBadge({ level, gender }: { level: LevelId; gender: Gender }) {
  return <span className={`badge badge--${level}`}>{LEVELS[level].badge[gender]}</span>;
}

export function SurfaceDot({ surface }: { surface: Surface }) {
  const locale = useSettings((s) => s.locale);
  return <span className={`surface-dot surface-dot--${surface}`} title={SURFACE_INFO[surface].name[locale]} />;
}

export function Flag({ nat }: { nat: string }) {
  if (nat === 'PL') return <span className="flag flag--pl" title="Polska" />;
  return <span className="flag">{nat}</span>;
}

export function Chips({ chips }: { chips: { text: string; tone: 'up' | 'down' | 'neutral' }[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
      {chips.map((c, i) => (
        <span key={i} className={`chip ${c.tone === 'up' ? 'chip--up' : c.tone === 'down' ? 'chip--down' : ''}`}>
          {c.text}
        </span>
      ))}
    </div>
  );
}
