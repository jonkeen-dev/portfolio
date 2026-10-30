export function ladderStatusLine(input: {
  status: string;
  sessionsAtTop: number;
  targetMax: number | null;
  unit: string;
  nextName?: string | null;
}): string {
  if (input.status === "HOLD") return "Lighter week. Level-ups pick back up next week.";
  if (input.status === "NO_DATA") return "No sessions yet.";
  const noun = input.unit.startsWith("seconds") ? "seconds" : "reps";
  const at = input.targetMax ? `${input.targetMax} ${noun}` : "the top of the range";
  const next = input.nextName?.trim();
  if (input.status === "READY") {
    return next ? `2 of 2 sessions at ${at}. You can move to ${next}.` : `2 of 2 sessions at ${at}.`;
  }
  if (input.sessionsAtTop >= 1 && next) {
    return `1 of 2 sessions at ${at}. One more and you can move to ${next}.`;
  }
  if (input.sessionsAtTop >= 1) return `1 of 2 sessions at ${at}.`;
  return "0 of 2 sessions at the top of the range.";
}

export function ladderTag(status: string, sessionsAtTop: number): string | null {
  if (status === "READY") return "Ready";
  if (status === "HOLD") return "Lighter week, on hold";
  if (sessionsAtTop === 1) return "1 of 2";
  return null;
}

export function movementStatusLine(input: {
  status: string;
  reason: string;
  suggestedName?: string | null;
  tooHardMessage?: string | null;
}): string {
  if (input.status === "HOLD") {
    return "Lighter week. Level-ups pick back up next week.";
  }
  const label =
    input.status === "READY"
      ? "Ready to level up"
      : input.status === "NOT_YET"
        ? "Not yet"
        : input.status === "NO_DATA"
          ? "No sessions yet"
          : input.status;
  const next = input.suggestedName ? ` Next: ${input.suggestedName}.` : "";
  const hard = input.tooHardMessage ? ` ${input.tooHardMessage}` : "";
  return `${label}. ${input.reason}${next}${hard}`.replace(/\s+/g, " ").trim();
}

export function sessionDoneLine(items: Array<{ unit: string; logged: Array<number | null> }>): string {
  const exercises = items.filter((item) => item.logged.some((value) => typeof value === "number")).length;
  let reps = 0;
  let holds = 0;
  for (const item of items) {
    for (const value of item.logged) {
      if (typeof value !== "number") continue;
      if (item.unit.startsWith("seconds")) holds += value;
      else reps += value;
    }
  }
  const exerciseLabel = exercises === 1 ? "1 exercise" : `${exercises} exercises`;
  const parts = [`Done. ${exerciseLabel}`, `${reps} reps`];
  if (holds > 0) {
    const minutes = Math.floor(holds / 60);
    const seconds = String(holds % 60).padStart(2, "0");
    parts.push(`${minutes}:${seconds} of holds`);
  }
  return `${parts.join(", ")}.`;
}

export function setButtonName(exercise: string, setNumber: number, logged: number | null, unit: string): string {
  if (typeof logged !== "number") return `${exercise}, set ${setNumber}`;
  const noun = unit.startsWith("seconds") ? "seconds" : "reps";
  return `${exercise}, set ${setNumber}, ${logged} ${noun}, saved`;
}
