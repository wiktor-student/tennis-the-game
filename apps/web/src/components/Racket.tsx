import { RACKETS } from '@ttg/engine';
import { useId } from 'react';

interface Props {
  racketId: string;
  size?: number;
  tilt?: number;
  className?: string;
}

/** Racket illustration painted with a collectible paint job. */
export function Racket({ racketId, size = 96, tilt = -18, className }: Props) {
  const r = RACKETS.find((x) => x.id === racketId) ?? RACKETS[0]!;
  const clip = useId();
  const strings: JSX.Element[] = [];
  for (let x = 10; x <= 50; x += 4)
    strings.push(<line key={`v${x}`} x1={x} y1={8} x2={x} y2={84} />);
  for (let y = 14; y <= 80; y += 4)
    strings.push(<line key={`h${y}`} x1={4} y1={y} x2={56} y2={y} />);
  return (
    <svg
      className={className}
      viewBox="0 0 60 160"
      width={size * 0.375}
      height={size}
      style={{ rotate: `${tilt}deg` }}
      role="img"
      aria-label={r.name.en}
    >
      <defs>
        <clipPath id={clip}>
          <ellipse cx="30" cy="46" rx="21" ry="31" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`} stroke="rgba(239,233,216,0.55)" strokeWidth="0.7">
        {strings}
      </g>
      <ellipse cx="30" cy="46" rx="24" ry="34" fill="none" stroke={r.frame} strokeWidth="5" />
      <ellipse
        cx="30"
        cy="46"
        rx="24"
        ry="34"
        fill="none"
        stroke={r.accent}
        strokeWidth="5"
        strokeDasharray="34 180"
        strokeDashoffset="-60"
      />
      <path
        d="M14 70 L27 102 M46 70 L33 102"
        stroke={r.frame}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M22 84 Q30 88 38 84" stroke={r.frame} strokeWidth="3" fill="none" />
      <rect x="25.5" y="100" width="9" height="54" rx="3" fill={r.grip} />
      <rect x="25.5" y="100" width="9" height="6" rx="1.5" fill={r.accent} />
      <path
        d="M26 112 L34 118 M26 122 L34 128 M26 132 L34 138 M26 142 L34 148"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1.2"
      />
    </svg>
  );
}
