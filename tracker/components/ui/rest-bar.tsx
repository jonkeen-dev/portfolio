"use client";

import { Button } from "@/components/ui/button";

function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

/** Presentational rest countdown. Phase 2 wires this to the session timer. */
export function RestBar({
  eyebrow,
  secondsLeft,
  totalSeconds,
  ended = false,
  endedLabel = "Rest's up.",
  onAdd,
  onSkip,
}: {
  eyebrow: string;
  secondsLeft: number;
  totalSeconds: number;
  ended?: boolean;
  endedLabel?: string;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const label = clock(secondsLeft);
  const width = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;
  return (
    <section className={ended ? "rest-bar is-ended" : "rest-bar"} role="timer" aria-live="off" aria-label={ended ? endedLabel : `${eyebrow}. ${label}`}>
      <p className="eyebrow">{ended ? endedLabel : eyebrow}</p>
      {ended ? null : <p className="num-rest">{label}</p>}
      <div className="rest-track" aria-hidden="true">
        <div className="rest-fill" style={{ width: `${width}%` }} />
      </div>
      <div className="row">
        <Button variant="secondary" onClick={onAdd}>
          +15 s
        </Button>
        <Button variant="primary" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </section>
  );
}
