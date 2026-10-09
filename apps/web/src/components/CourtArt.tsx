/** Centre-court lines in perspective — the hero illustration of the main menu. */
export function CourtArt() {
  // Court corners in perspective (baseline far → near).
  const far = { l: 210, r: 390, y: 40 };
  const near = { l: 40, r: 560, y: 250 };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const at = (t: number) => ({ y: lerp(far.y, near.y, t), l: lerp(far.l, near.l, t), r: lerp(far.r, near.r, t) });
  const alley = 0.125;
  const xAt = (row: ReturnType<typeof at>, u: number) => lerp(row.l, row.r, u);
  const netRow = at(0.47);
  const svcFar = at(0.24);
  const svcNear = at(0.73);

  return (
    <svg className="court-art" viewBox="0 0 600 270" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#173827" />
          <stop offset="1" stopColor="#1f4a32" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1510" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#0a1510" stopOpacity="0" />
          <stop offset="1" stopColor="#0a1510" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <polygon points={`${far.l - 40},${far.y - 20} ${far.r + 40},${far.y - 20} ${near.r + 60},${near.y + 20} ${near.l - 60},${near.y + 20}`} fill="url(#lawn)" />
      {/* mowing stripes */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = at(i / 9);
        const b = at((i + 1) / 9);
        return i % 2 === 0 ? (
          <polygon key={i} points={`${a.l - 40},${a.y} ${a.r + 40},${a.y} ${b.r + 46},${b.y} ${b.l - 46},${b.y}`} fill="rgba(255,255,255,0.025)" />
        ) : null;
      })}
      <g stroke="rgba(239,233,216,0.72)" strokeWidth="2" fill="none" strokeLinejoin="round">
        <polygon points={`${far.l},${far.y} ${far.r},${far.y} ${near.r},${near.y} ${near.l},${near.y}`} />
        <line x1={xAt(at(0), alley)} y1={far.y} x2={xAt(at(1), alley)} y2={near.y} />
        <line x1={xAt(at(0), 1 - alley)} y1={far.y} x2={xAt(at(1), 1 - alley)} y2={near.y} />
        <line x1={xAt(svcFar, alley)} y1={svcFar.y} x2={xAt(svcFar, 1 - alley)} y2={svcFar.y} />
        <line x1={xAt(svcNear, alley)} y1={svcNear.y} x2={xAt(svcNear, 1 - alley)} y2={svcNear.y} />
        <line x1={xAt(svcFar, 0.5)} y1={svcFar.y} x2={xAt(svcNear, 0.5)} y2={svcNear.y} />
        <line x1={xAt(at(0), 0.5)} y1={far.y} x2={xAt(at(0), 0.5)} y2={far.y + 5} />
        <line x1={xAt(at(1), 0.5)} y1={near.y} x2={xAt(at(1), 0.5)} y2={near.y - 7} />
      </g>
      {/* net */}
      <g>
        <rect x={netRow.l - 14} y={netRow.y - 16} width={netRow.r - netRow.l + 28} height="16" fill="rgba(5,12,8,0.55)" />
        <line x1={netRow.l - 14} y1={netRow.y - 16} x2={netRow.r + 14} y2={netRow.y - 16} stroke="#efe9d8" strokeWidth="2.5" />
        <line x1={netRow.l - 14} y1={netRow.y - 18} x2={netRow.l - 14} y2={netRow.y + 2} stroke="#c9cfbf" strokeWidth="3" />
        <line x1={netRow.r + 14} y1={netRow.y - 18} x2={netRow.r + 14} y2={netRow.y + 2} stroke="#c9cfbf" strokeWidth="3" />
      </g>
      <circle className="court-art__ball" cx="372" cy="176" r="6" fill="#d8ef4a" />
      <ellipse cx="368" cy="232" rx="7" ry="2" fill="rgba(0,0,0,0.35)" />
      <rect width="600" height="270" fill="url(#fade)" />
    </svg>
  );
}
