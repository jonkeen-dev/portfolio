import { describe, expect, it } from "vitest";

import { nextTrainingIso, setGuidance, weekdayName } from "../lib/plan";
import { clockLabel, extendRest, remainingSeconds, restBounds, restShouldHide, startRest, withRestEnd } from "../lib/timer";
import { readWorkoutPrefs, restSecondsFor } from "../lib/workout-prefs";

describe("rest timer", () => {
  const now = 1_000_000;

  it("counts down from a timestamp and survives a later clock read", () => {
    const rest = startRest("Rest, then set 2", 60, now);
    expect(remainingSeconds(rest.endsAt, now)).toBe(60);
    expect(remainingSeconds(rest.endsAt, now + 15_000)).toBe(45);
    expect(clockLabel(45)).toBe("0:45");
  });

  it("adds 15 seconds from the later of now and the current end", () => {
    const rest = startRest("Rest, then set 2", 60, now);
    const extended = extendRest(rest, 15, now + 50_000);
    expect(remainingSeconds(extended.endsAt, now + 50_000)).toBe(25);
    expect(extended.totalSeconds).toBe(75);
  });

  it("turns green at zero and hides 10 seconds later", () => {
    const rest = startRest("Rest, then set 2", 60, now);
    const ended = withRestEnd(rest, now + 60_000);
    expect(ended.ended).toBe(true);
    expect(restShouldHide(ended, now + 69_000)).toBe(false);
    expect(restShouldHide(ended, now + 70_000)).toBe(true);
  });

  it("reads the short and long ends of a rest range", () => {
    expect(restBounds("60-90 s")).toEqual({ short: 60, long: 90 });
    expect(restBounds("60 s")).toEqual({ short: 60, long: 60 });
    expect(restSecondsFor("shortest", { short: 60, long: 90 })).toBe(60);
    expect(restSecondsFor("longest", { short: 60, long: 90 })).toBe(90);
    expect(restSecondsFor("off", { short: 60, long: 90 })).toBe(0);
  });
});

describe("workout copy", () => {
  it("names the weekday and the next training day", () => {
    expect(weekdayName("2026-10-22")).toBe("Thursday");
    expect(nextTrainingIso("2026-10-22", "2026-10-12")).toBe("2026-10-23");
  });

  it("tells you the aim, the last set, and when you are above the range", () => {
    expect(
      setGuidance({ targetMin: 8, targetMax: 12, setNumber: 1, previousSameSet: 10, earlierThisSession: null, value: 10 }),
    ).toBe("Aim for 8–12. Last time you did 10.");
    expect(
      setGuidance({ targetMin: 8, targetMax: 12, setNumber: 2, previousSameSet: null, earlierThisSession: 12, value: 12 }),
    ).toBe("Hit 12 again and this session counts toward moving up.");
    expect(
      setGuidance({ targetMin: 8, targetMax: 12, setNumber: 2, previousSameSet: null, earlierThisSession: 11, value: 13 }),
    ).toBe("Above the range. Nice. Counts as the top.");
  });
});

describe("workout prefs", () => {
  it("defaults the timer to the short rest and keeps vibration on", () => {
    expect(readWorkoutPrefs({})).toMatchObject({ restTimer: "shortest", vibrate: true, holdLeadIn: true, keepScreenOn: true });
    expect(readWorkoutPrefs({ restTimer: "off", vibrate: false }).vibrate).toBe(false);
  });
});
