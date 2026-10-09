import type { Gender } from '@ttg/engine';

/** Polaroid photo with an ink-drawn player silhouette mid-serve. */
export function Polaroid({
  gender,
  caption,
  age,
}: {
  gender: Gender;
  caption: string;
  age: number;
}) {
  // Kids are drawn smaller in the frame — the photo "grows up" with the career.
  const scale = Math.min(1, 0.72 + (age - 8) * 0.025);
  return (
    <figure className="polaroid">
      <svg viewBox="0 0 120 120" role="img" aria-label={caption}>
        <rect width="120" height="120" fill="#cfdccb" />
        <rect y="86" width="120" height="34" fill="#9fb592" />
        <line x1="0" y1="92" x2="120" y2="92" stroke="#f4f1e6" strokeWidth="1.5" />
        <g
          transform={`translate(60 112) scale(${scale}) translate(-60 -112)`}
          fill="var(--ink)"
          stroke="var(--ink)"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* ball in the air */}
          <circle cx="78" cy="14" r="4" fill="var(--highlight)" strokeWidth="1.2" />
          {/* head */}
          <circle cx="60" cy="40" r="7" stroke="none" />
          {gender === 'F' && <path d="M53 38 q-6 8 -2 16" fill="none" strokeWidth="3" />}
          {/* body */}
          <path d="M60 47 L58 78" strokeWidth="7" fill="none" />
          {/* tossing arm */}
          <path d="M60 52 L72 30 L76 20" strokeWidth="4" fill="none" />
          {/* racket arm behind head */}
          <path d="M59 52 L46 44 L40 30" strokeWidth="4" fill="none" />
          <ellipse
            cx="37"
            cy="18"
            rx="6"
            ry="9"
            fill="none"
            strokeWidth="2.5"
            transform="rotate(-20 37 18)"
          />
          <line x1="39" y1="26" x2="40" y2="30" strokeWidth="2.5" />
          {/* legs */}
          <path d="M58 78 L52 96 L48 112" strokeWidth="5" fill="none" />
          <path d="M58 78 L66 94 L70 110" strokeWidth="5" fill="none" />
          {gender === 'F' && <path d="M52 74 L64 74 L67 84 L50 84 Z" stroke="none" />}
        </g>
      </svg>
      <figcaption className="hand">{caption}</figcaption>
    </figure>
  );
}
