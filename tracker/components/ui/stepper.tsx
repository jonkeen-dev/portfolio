"use client";

import { Button } from "@/components/ui/button";
import { clampCount } from "@/lib/stepper";

export function Stepper({
  id,
  value,
  onChange,
  min = 0,
  max = 600,
  unit,
  label,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit: string;
  label: string;
}) {
  const seconds = unit.startsWith("second");
  const fewer = seconds ? "One fewer second" : "One fewer rep";
  const more = seconds ? "One more second" : "One more rep";

  function set(next: number) {
    onChange(clampCount(next, min, max));
  }

  return (
    <div className="stepper">
      <Button variant="stepper" aria-label={fewer} onClick={() => set(value - 1)}>
        −
      </Button>
      <div className="stepper-value">
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => set(Number(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "PageUp") {
              event.preventDefault();
              set(value + 10);
            }
            if (event.key === "PageDown") {
              event.preventDefault();
              set(value - 10);
            }
          }}
        />
        <span className="meta">{unit}</span>
      </div>
      <Button variant="stepper" aria-label={more} onClick={() => set(value + 1)}>
        +
      </Button>
    </div>
  );
}
