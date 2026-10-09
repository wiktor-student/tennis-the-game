import { SKILL_IDS, SKILL_INFO, type Skills } from '@ttg/engine';
import { useSettings } from '../store/settings';

interface Props {
  skills: Skills;
  /** Skills at the start of the season — drawn as a pencil outline to show growth. */
  previous?: Skills | null;
  size?: number;
}

/** Seven-axis skill chart drawn like a pen sketch in the notebook. */
export function Radar({ skills, previous, size = 230 }: Props) {
  const locale = useSettings((s) => s.locale);
  const c = 100;
  const r = 70;
  const n = SKILL_IDS.length;
  const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)] as const;
  };
  const poly = (s: Skills) => SKILL_IDS.map((id, i) => point(i, s[id]).join(',')).join(' ');

  return (
    <svg
      className="radar"
      viewBox="-22 -4 244 208"
      width={size}
      height={size}
      role="img"
      aria-label="Umiejętności"
    >
      <defs>
        <pattern
          id="hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--hard)" strokeWidth="1.2" opacity="0.45" />
        </pattern>
      </defs>
      {[25, 50, 75, 100].map((ring) => (
        <polygon
          key={ring}
          points={SKILL_IDS.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={ring === 100 ? 1.2 : 0.8}
          strokeDasharray={ring === 100 ? undefined : '2 3'}
        />
      ))}
      {SKILL_IDS.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--rule)" strokeWidth="0.8" />;
      })}
      {previous && (
        <polygon
          points={poly(previous)}
          fill="none"
          stroke="var(--pencil-2)"
          strokeWidth="1.2"
          strokeDasharray="3 2"
        />
      )}
      <polygon
        className="radar__shape"
        points={poly(skills)}
        fill="url(#hatch)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {SKILL_IDS.map((id, i) => {
        const [x, y] = point(i, skills[id]);
        return <circle key={id} cx={x} cy={y} r="2.6" fill="var(--margin)" />;
      })}
      {SKILL_IDS.map((id, i) => {
        const [x, y] = point(i, 128);
        return (
          <g key={id}>
            <text
              x={x}
              y={y - 3}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="7.5"
              fill="var(--pencil)"
              letterSpacing="0.5"
            >
              {SKILL_INFO[id].short[locale].toUpperCase()}
            </text>
            <text
              x={x}
              y={y + 9}
              textAnchor="middle"
              fontFamily="var(--font-hand)"
              fontSize="15"
              fontWeight="700"
              fill="var(--ink)"
            >
              {Math.round(skills[id])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
