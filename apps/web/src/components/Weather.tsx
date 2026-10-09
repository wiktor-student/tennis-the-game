import type { FormId } from '@ttg/engine';

/** Season form as a weather forecast — from storm (crisis) to blazing sun (season of a lifetime). */
export function Weather({ form, size = 44 }: { form: FormId; size?: number }) {
  const sun = (r: number, rays: boolean) => (
    <g stroke="var(--ink)" strokeWidth="2" fill="var(--highlight)">
      <circle cx="24" cy="22" r={r} />
      {rays &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={24 + Math.cos(a) * (r + 3)}
              y1={22 + Math.sin(a) * (r + 3)}
              x2={24 + Math.cos(a) * (r + 7)}
              y2={22 + Math.sin(a) * (r + 7)}
              strokeLinecap="round"
            />
          );
        })}
    </g>
  );
  const cloud = (dx = 0, dy = 0, fill = 'var(--card)') => (
    <path
      transform={`translate(${dx} ${dy})`}
      d="M14 34 h22 a7 7 0 0 0 0 -14 a9 9 0 0 0 -17 -2 a6 6 0 0 0 -5 16 z"
      fill={fill}
      stroke="var(--ink)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
  const rain = (
    <g stroke="var(--hard)" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="38" x2="16" y2="44" />
      <line x1="25" y1="38" x2="23" y2="44" />
      <line x1="32" y1="38" x2="30" y2="44" />
    </g>
  );
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="weather">
      {form === 'life' && (
        <>
          {sun(9, true)}
          <path
            d="M40 6 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5z"
            fill="var(--margin)"
          />
        </>
      )}
      {form === 'great' && sun(9, true)}
      {form === 'good' && (
        <>
          {sun(8, true)}
          {cloud(4, 6)}
        </>
      )}
      {form === 'normal' && cloud(0, 0)}
      {form === 'weak' && (
        <>
          {cloud(0, -4, 'var(--paper-3)')}
          {rain}
        </>
      )}
      {form === 'crisis' && (
        <>
          {cloud(0, -4, 'var(--pencil-2)')}
          <path
            d="M26 30 l-5 8 h5 l-3 8 8 -11 h-5 l3 -5z"
            fill="var(--highlight)"
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
