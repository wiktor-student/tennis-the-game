/** A name written by hand on the signature line (animated stroke, then filled). */
export function Signature({ name, signed }: { name: string; signed: boolean }) {
  return (
    <span className="signature" data-signed={signed}>
      <svg viewBox="0 0 220 44" aria-hidden="true">
        {signed && (
          <text x="6" y="32" className="signature__text">
            {name}
          </text>
        )}
        <line
          x1="0"
          y1="38"
          x2="220"
          y2="38"
          stroke="var(--ink)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      </svg>
    </span>
  );
}
