export type RestSnapshot = {
  endsAt: number;
  totalSeconds: number;
  eyebrow: string;
  ended: boolean;
  endedAt: number | null;
};

export function remainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function startRest(eyebrow: string, seconds: number, now: number): RestSnapshot {
  const total = Math.max(1, Math.round(seconds));
  return {
    endsAt: now + total * 1000,
    totalSeconds: total,
    eyebrow,
    ended: false,
    endedAt: null,
  };
}

export function extendRest(rest: RestSnapshot, extraSeconds: number, now: number): RestSnapshot {
  const extra = Math.max(0, Math.round(extraSeconds));
  const base = Math.max(rest.endsAt, now);
  return {
    ...rest,
    endsAt: base + extra * 1000,
    totalSeconds: rest.totalSeconds + extra,
    ended: false,
    endedAt: null,
  };
}

/** Move a running rest into the green ended state once the timestamp has passed. */
export function withRestEnd(rest: RestSnapshot, now: number): RestSnapshot {
  if (rest.ended || now < rest.endsAt) return rest;
  return { ...rest, ended: true, endedAt: now };
}

export function restShouldHide(rest: RestSnapshot, now: number): boolean {
  return rest.ended && rest.endedAt !== null && now - rest.endedAt >= 10_000;
}

export function clockLabel(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Low and high ends of a rest string such as "60-90 s". */
export function restBounds(text: string | null | undefined): { short: number; long: number } {
  if (!text) return { short: 60, long: 60 };
  const minuteHits = [...text.matchAll(/(\d+)\s*min/g)].map((match) => Number(match[1]) * 60);
  const nums = minuteHits.length > 0 ? minuteHits : [...text.matchAll(/(\d+)/g)].map((match) => Number(match[1]));
  if (nums.length === 0) return { short: 60, long: 60 };
  return { short: Math.min(...nums), long: Math.max(...nums) };
}
