import { TACTICS_BY_ID, type TacticDef, type TacticOptionView } from '@ttg/engine';
import { useContent, useT } from '../i18n';

/** Mini court diagram for each tactic (half court seen from above, net at the top). */
function Glyph({ glyph }: { glyph: TacticDef['glyph'] }) {
  const court = (
    <g stroke="var(--pencil-2)" strokeWidth="1" fill="none">
      <rect x="8" y="8" width="64" height="56" />
      <line x1="8" y1="8" x2="72" y2="8" stroke="var(--ink)" strokeWidth="2" />
      <line x1="16" y1="8" x2="16" y2="64" />
      <line x1="64" y1="8" x2="64" y2="64" />
      <line x1="16" y1="36" x2="64" y2="36" />
      <line x1="40" y1="8" x2="40" y2="36" />
    </g>
  );
  const ink = {
    stroke: 'var(--ink)',
    strokeWidth: 2,
    fill: 'none',
    strokeLinecap: 'round' as const,
  };
  const ball = (x: number, y: number) => (
    <circle cx={x} cy={y} r="3" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="1" />
  );
  const art: Record<TacticDef['glyph'], JSX.Element> = {
    baseline: (
      <>
        <path d="M24 60 Q40 -6 56 60" {...ink} />
        <path d="M56 60 Q40 -2 22 58" {...ink} strokeDasharray="3 3" />
        {ball(56, 60)}
      </>
    ),
    arrow: (
      <>
        <path d="M58 60 L22 14" {...ink} />
        <path d="M22 14 l2 8 M22 14 l8 2" {...ink} />
        {ball(58, 60)}
      </>
    ),
    serve: (
      <>
        <path d="M44 64 L28 16" {...ink} />
        <path d="M28 16 L56 40" {...ink} strokeDasharray="3 3" />
        {ball(44, 64)}
      </>
    ),
    arc: (
      <>
        <path d="M30 62 C 10 -30, 60 -30, 52 26" {...ink} />
        {ball(52, 26)}
      </>
    ),
    net: (
      <>
        <path d="M44 64 L30 20" {...ink} />
        <path d="M44 64 L42 22" {...ink} strokeDasharray="3 3" />
        <circle cx="42" cy="18" r="4" fill="var(--ink)" />
      </>
    ),
    chip: (
      <>
        <path d="M22 14 Q32 40 46 44" {...ink} />
        <path d="M46 44 L44 18" {...ink} strokeDasharray="3 3" />
        {ball(22, 14)}
      </>
    ),
    drop: (
      <>
        <path d="M50 62 Q44 0 34 12" {...ink} />
        <path d="M34 12 Q40 -10 56 58" {...ink} strokeDasharray="3 3" />
        {ball(34, 12)}
      </>
    ),
    return: (
      <>
        <path d="M30 10 L50 54" {...ink} />
        <path d="M50 54 l-1 -8 M50 54 l-7 -4" {...ink} />
        {ball(30, 10)}
      </>
    ),
    wall: (
      <g stroke="var(--ink)" strokeWidth="1.6" fill="none">
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            <line x1="18" y1={30 + r * 8} x2="62" y2={30 + r * 8} />
            {[0, 1, 2].map((c) => (
              <line
                key={c}
                x1={26 + c * 14 + (r % 2) * 7}
                y1={22 + r * 8}
                x2={26 + c * 14 + (r % 2) * 7}
                y2={30 + r * 8}
              />
            ))}
          </g>
        ))}
        <line x1="18" y1="22" x2="62" y2="22" />
      </g>
    ),
    curve: (
      <>
        <path d="M24 60 C 64 52, 64 30, 52 12" {...ink} />
        <path d="M52 12 l-1 8 M52 12 l7 4" {...ink} />
        {ball(24, 60)}
      </>
    ),
    mind: (
      <path
        d="M40 36 m0 0 a3 3 0 0 1 6 0 a6 6 0 0 1 -12 0 a9 9 0 0 1 18 0 a12 12 0 0 1 -24 0 a15 15 0 0 1 30 0"
        {...ink}
      />
    ),
    bolt: (
      <path
        d="M44 10 L28 40 h12 l-6 24 20 -32 h-12 l8 -22z"
        fill="var(--highlight)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  };
  return (
    <svg viewBox="0 0 80 72" className="tactic-card__glyph" aria-hidden="true">
      {glyph !== 'wall' && glyph !== 'mind' && glyph !== 'bolt' && court}
      {art[glyph]}
    </svg>
  );
}

/** Edge scale −4…+4 percentage points with a marker. */
export function EdgeMeter({ edge, spread }: { edge: number; spread: number }) {
  const pp = edge * 100;
  const sd = spread * 100;
  const x = (v: number) => 50 + Math.max(-4.4, Math.min(4.4, v)) * 10;
  return (
    <svg viewBox="0 0 100 22" className="edge-meter" aria-hidden="true">
      <line x1="6" y1="12" x2="94" y2="12" stroke="var(--ink)" strokeWidth="1" />
      {[-4, -2, 0, 2, 4].map((v) => (
        <line
          key={v}
          x1={x(v)}
          y1={v === 0 ? 6 : 9}
          x2={x(v)}
          y2={v === 0 ? 18 : 15}
          stroke="var(--ink)"
          strokeWidth={v === 0 ? 1.4 : 0.8}
        />
      ))}
      <rect
        x={x(pp - sd)}
        y="9.5"
        width={Math.max(1, x(pp + sd) - x(pp - sd))}
        height="5"
        fill={pp >= 0 ? 'var(--ok)' : 'var(--bad)'}
        opacity="0.25"
      />
      <circle
        cx={x(pp)}
        cy="12"
        r="4"
        fill={pp >= 0 ? 'var(--ok)' : 'var(--bad)'}
        stroke="var(--card)"
        strokeWidth="1"
      />
    </svg>
  );
}

interface Props {
  view: TacticOptionView;
  onPlay?: () => void;
  compact?: boolean;
  disabled?: boolean;
  best?: boolean;
}

export function TacticCard({ view, onPlay, compact, disabled, best }: Props) {
  const t = useT();
  const c = useContent();
  const def = TACTICS_BY_ID[view.tacticId];
  if (!def) return null;
  const pp = view.edge * 100;
  const Tag = onPlay ? 'button' : 'div';
  return (
    <Tag
      className={`tactic-card ${compact ? 'tactic-card--compact' : ''}`}
      onClick={onPlay}
      disabled={onPlay ? disabled : undefined}
      data-best={best}
      aria-label={`${c(def.name)} · ${pp >= 0 ? '+' : ''}${pp.toFixed(1)}`}
    >
      <span className="tactic-card__corner mono">
        {pp >= 0 ? '+' : '−'}
        {Math.abs(pp).toFixed(1)}
      </span>
      <Glyph glyph={def.glyph} />
      <strong className="tactic-card__name">{c(def.name)}</strong>
      {!compact && <span className="tactic-card__motto hand">{c(def.motto)}</span>}
      <EdgeMeter edge={view.edge} spread={view.spread} />
      <span className="tactic-card__foot">
        <span className="label">{t('tactic.risk')}</span>
        <span
          className="tactic-card__risk"
          data-risk={def.risk >= 0.8 ? 'high' : def.risk >= 0.45 ? 'mid' : 'low'}
        />
        <span className="tactic-card__mastery" title={t('tactic.mastery')}>
          {[0, 1, 2].map((i) => (
            <span key={i} data-on={i < view.mastery} />
          ))}
        </span>
      </span>
    </Tag>
  );
}
