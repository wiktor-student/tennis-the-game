import { LEVELS, type Gender, type LevelId, type Surface } from '@ttg/engine';
import { useId } from 'react';

const SURFACE_INK: Record<Surface, string> = {
  clay: 'var(--clay)',
  grass: 'var(--grass)',
  hard: 'var(--hard)',
  indoor: 'var(--indoor)',
};

interface Props {
  city: string;
  level: LevelId;
  gender: Gender;
  surface: Surface;
  /** Bottom line, e.g. a month or a result. */
  caption?: string;
  /** Inked (played / selected) or just a pencil outline. */
  inked?: boolean;
  size?: number;
  seed?: string;
  result?: string | null;
}

function tilt(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (((h % 15) + 15) % 15) - 7;
}

/** A tournament as a postmark: city around the ring, level in the middle, surface as ink colour. */
export function Stamp({
  city,
  level,
  gender,
  surface,
  caption,
  inked = true,
  size = 92,
  seed,
  result,
}: Props) {
  const id = useId();
  const ink = inked ? SURFACE_INK[surface] : 'var(--pencil-2)';
  const badge = LEVELS[level].badge[gender];
  const text = city.toUpperCase();
  return (
    <svg
      className="stamp"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ rotate: `${tilt(seed ?? city)}deg`, opacity: inked ? 0.92 : 0.75 }}
      role="img"
      aria-label={`${city} · ${badge}${result ? ` · ${result}` : ''}`}
    >
      <defs>
        <path id={`${id}-ring`} d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
        <filter id={`${id}-rough`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale={inked ? 1.6 : 0.6} />
        </filter>
      </defs>
      <g
        filter={`url(#${id}-rough)`}
        fill="none"
        stroke={ink}
        strokeDasharray={inked ? undefined : '3 3'}
      >
        <circle cx="50" cy="50" r="46" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="25" strokeWidth="1.5" />
        <text
          fill={ink}
          stroke="none"
          fontFamily="var(--font-mono)"
          fontSize={text.length > 16 ? 8 : 10}
          fontWeight="600"
          letterSpacing="1.5"
        >
          <textPath href={`#${id}-ring`} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
        <text
          x="50"
          y={result ? 50 : 54}
          textAnchor="middle"
          fill={ink}
          stroke="none"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fontWeight="700"
        >
          {badge}
        </text>
        {result && (
          <text
            x="50"
            y="64"
            textAnchor="middle"
            fill={ink}
            stroke="none"
            fontFamily="var(--font-hand)"
            fontSize="15"
            fontWeight="700"
          >
            {result}
          </text>
        )}
        {caption && (
          <text
            x="50"
            y="93"
            textAnchor="middle"
            fill={ink}
            stroke="none"
            fontFamily="var(--font-mono)"
            fontSize="7"
            letterSpacing="1"
          >
            {caption}
          </text>
        )}
      </g>
    </svg>
  );
}
