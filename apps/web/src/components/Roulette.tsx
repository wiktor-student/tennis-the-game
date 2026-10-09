import { useEffect, useMemo, useRef, useState } from 'react';
import type { DecisionOptionView, DecisionOutcome } from '@ttg/engine';
import { useSettings } from '../store/settings';

const CELLS = 40;

interface Props {
  option: DecisionOptionView;
  /** Engine roll in [0,1) — the outcome is already decided; the reel only reveals it. */
  roll: number | null;
  outcome: DecisionOutcome | null;
  onDone?: () => void;
}

/** Chance strip: super / success / fail segments with a marker that sweeps to the roll. */
export function Roulette({ option, roll, outcome, onDone }: Props) {
  const motion = useSettings((s) => s.motion);
  const [pos, setPos] = useState(0);
  const [settled, setSettled] = useState(roll === null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const cells = useMemo(() => {
    const out: DecisionOutcome[] = [];
    for (let i = 0; i < CELLS; i++) {
      const x = (i + 0.5) / CELLS;
      out.push(x < option.superChance ? 'super' : x < option.chance ? 'success' : 'fail');
    }
    return out;
  }, [option]);

  useEffect(() => {
    if (roll === null) return;
    if (motion === 'none') {
      setPos(roll);
      setSettled(true);
      doneRef.current?.();
      return;
    }
    const duration = motion === 'reduced' ? 500 : 1700;
    const sweeps = motion === 'reduced' ? 0 : 2;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const travel = (sweeps + roll) * eased;
      const bounce = travel % 2;
      setPos(bounce > 1 ? 2 - bounce : bounce);
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        setPos(roll);
        setSettled(true);
        doneRef.current?.();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [roll, motion]);

  return (
    <div className="roulette" data-settled={settled} data-outcome={settled ? (outcome ?? '') : ''}>
      <div className="roulette__strip">
        {cells.map((c, i) => (
          <span key={i} className={`roulette__cell roulette__cell--${c}`} />
        ))}
        {roll !== null && <span className="roulette__marker" style={{ left: `${pos * 100}%` }} />}
      </div>
    </div>
  );
}

/** Super / success / fail proportions for an option card. */
export function ChanceBar({ option }: { option: DecisionOptionView }) {
  const s = option.superChance * 100;
  const ok = (option.chance - option.superChance) * 100;
  return (
    <div className="chance-bar" aria-hidden="true">
      <span className="chance-bar__super" style={{ width: `${s}%` }} />
      <span className="chance-bar__success" style={{ width: `${ok}%` }} />
      <span className="chance-bar__fail" style={{ width: `${100 - s - ok}%` }} />
    </div>
  );
}
