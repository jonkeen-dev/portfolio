"use client";

import { useRef } from "react";

export type ChipOption = { value: string; label: string };

export function ChipGroup({
  label,
  labelId,
  value,
  options,
  onChange,
}: {
  label: string;
  labelId?: string;
  value: string;
  options: ChipOption[];
  onChange: (value: string) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const match = options.findIndex((option) => option.value === value);
  const selected = match >= 0 ? match : 0;

  function move(delta: number) {
    const next = (selected + delta + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      className="chip-row"
      role="radiogroup"
      aria-label={labelId ? undefined : label}
      aria-labelledby={labelId}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            className="btn btn-chip"
            aria-checked={checked}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => onChange(option.value)}
          >
            <span className="btn-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
