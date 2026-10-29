export type RestChoice = "shortest" | "longest" | "off";

export type WorkoutPrefs = {
  reduceMotion: boolean;
  restTimer: RestChoice;
  holdLeadIn: boolean;
  vibrate: boolean;
  keepScreenOn: boolean;
};

export function readWorkoutPrefs(raw: unknown): WorkoutPrefs {
  const prefs = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rest = prefs.restTimer;
  return {
    reduceMotion: prefs.reduceMotion === true,
    restTimer: rest === "longest" || rest === "off" || rest === "shortest" ? rest : "shortest",
    holdLeadIn: prefs.holdLeadIn === false ? false : true,
    vibrate: prefs.vibrate === false ? false : true,
    keepScreenOn: prefs.keepScreenOn === false ? false : true,
  };
}

export function restSecondsFor(choice: RestChoice, bounds: { short: number; long: number }): number {
  if (choice === "off") return 0;
  if (choice === "longest") return bounds.long;
  return bounds.short;
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}
