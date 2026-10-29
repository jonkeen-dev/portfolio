"use client";

import { Button } from "@/components/ui/button";

/** Presentational hold timer. Phase 2 starts it from timed exercises. */
export function HoldTimer({
  seconds,
  running,
  minimum,
  maximum,
  side,
  onStart,
  onStop,
}: {
  seconds: number;
  running: boolean;
  minimum: number;
  maximum: number;
  side?: string;
  onStart: () => void;
  onStop: () => void;
}) {
  const inRange = seconds >= minimum;
  const span = Math.max(1, maximum);
  const width = Math.max(0, Math.min(100, (seconds / span) * 100));
  return (
    <section className={inRange ? "hold-timer is-in-range" : "hold-timer"}>
      {side ? <p className="eyebrow">{side}</p> : null}
      <p className="num-hold">{seconds}</p>
      <div className="hold-track" aria-hidden="true">
        <div className={inRange ? "hold-fill is-done" : "hold-fill"} style={{ width: `${width}%` }} />
      </div>
      <p className="meta">{inRange ? "In range." : `Aim for ${minimum}–${maximum} seconds.`}</p>
      {running ? (
        <Button variant="primary" onClick={onStop}>
          Stop
        </Button>
      ) : (
        <Button variant="primary" onClick={onStart}>
          Start
        </Button>
      )}
    </section>
  );
}
