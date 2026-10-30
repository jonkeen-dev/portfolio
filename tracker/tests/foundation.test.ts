import { describe, expect, it } from "vitest";

import { loadWeeks } from "../lib/content";
import { ladderStatusLine, movementStatusLine, sessionDoneLine, setButtonName } from "../lib/copy";
import { deleteAccountError } from "../lib/account";
import { hashMagicToken, inviteMessage } from "../lib/invite-link";
import { formatCalendarDate, formatWeekdayDate, formatZonedDateTime } from "../lib/format";
import { matchesLibrary } from "../lib/library";
import { formatHoldClock, groupMovementSeries, recentSessionLine } from "../lib/progress";
import { clampCount, seedSetValue } from "../lib/stepper";

describe("stepper", () => {
  it("clamps and rounds into 0–600", () => {
    expect(clampCount(-4)).toBe(0);
    expect(clampCount(600.4)).toBe(600);
    expect(clampCount(1.6)).toBe(2);
    expect(clampCount(Number.NaN)).toBe(0);
  });

  it("seeds from the logged set, then last time, then the bottom of the range", () => {
    expect(seedSetValue(11, 8, 6)).toBe(11);
    expect(seedSetValue(null, 8, 6)).toBe(8);
    expect(seedSetValue(undefined, undefined, 6)).toBe(6);
  });
});

describe("copy", () => {
  it("does not repeat the hold status", () => {
    const line = movementStatusLine({
      status: "HOLD",
      reason: "Hold: deload/retest week. 12, 12 and 12, 12 were at the top, and level-ups are paused this week.",
    });
    expect(line).toBe("Lighter week. Level-ups pick back up next week.");
    expect(line).not.toMatch(/Hold\. Hold/);
  });

  it("names a saved set in plain language", () => {
    expect(setButtonName("Box Squat", 1, null, "reps")).toBe("Box Squat, set 1");
    expect(setButtonName("Box Squat", 1, 11, "reps")).toBe("Box Squat, set 1, 11 reps, saved");
  });

  it("summarises a finished session with real totals", () => {
    expect(
      sessionDoneLine([
        { unit: "reps", logged: [12, 12] },
        { unit: "seconds", logged: [40, 60] },
      ]),
    ).toBe("Done. 2 exercises, 24 reps, 1:40 of holds.");
  });
});

describe("dates", () => {
  it("formats calendar dates without shifting the day", () => {
    expect(formatCalendarDate("2026-10-05")).toBe("Oct 5, 2026");
  });

  it("formats an instant in the profile timezone", () => {
    const at = new Date("2026-10-29T04:51:00.000Z");
    const now = new Date("2026-10-29T15:00:00.000Z");
    expect(formatZonedDateTime(at, "America/New_York", "en-US", now)).toBe("Today 12:51 AM");
  });
});

describe("week notes", () => {
  it("uses the plain lighter-week wording and leaves the training numbers alone", () => {
    const weeks = loadWeeks();
    const week4 = weeks.find((week) => week.week === 4);
    const week8 = weeks.find((week) => week.week === 8);
    const week9 = weeks.find((week) => week.week === 9);
    const week12 = weeks.find((week) => week.week === 12);
    expect(week4?.focus).toBe("Lighter week");
    expect(week4?.coachNote).toMatch(/Fewer sets and easier effort this week/);
    expect(week4?.setsMain).toBe(2);
    expect(week4?.repMin).toBe(8);
    expect(week4?.repMax).toBe(10);
    expect(week8?.focus).toBe("Lighter week");
    expect(week8?.coachNote).toMatch(/helps your body catch up/);
    expect(week9?.repMin).toBe(5);
    expect(week9?.repMax).toBe(8);
    expect(week9?.coachNote).toMatch(/move up a level now/);
    expect(week12?.focus).toBe("Taper and retest");
    expect(week12?.coachNote).toMatch(/Week 1 numbers/);
    expect(week12?.setsMain).toBe(2);
  });
});

describe("ladders and progress copy", () => {
  it("states how close a movement is to the next rung", () => {
    expect(
      ladderStatusLine({
        status: "NOT_YET",
        sessionsAtTop: 1,
        targetMax: 12,
        unit: "reps",
        nextName: "Low Incline Push-Up",
      }),
    ).toBe("1 of 2 sessions at 12 reps. One more and you can move to Low Incline Push-Up.");
    expect(
      ladderStatusLine({
        status: "HOLD",
        sessionsAtTop: 2,
        targetMax: 12,
        unit: "reps",
        nextName: "Low Incline Push-Up",
      }),
    ).toBe("Lighter week. Level-ups pick back up next week.");
    expect(ladderStatusLine({ status: "NO_DATA", sessionsAtTop: 0, targetMax: null, unit: "reps" })).toBe(
      "No sessions yet.",
    );
  });

  it("formats holds, weekdays, and recent sessions", () => {
    expect(formatHoldClock(114)).toBe("1:54");
    expect(formatWeekdayDate("2026-10-21")).toBe("Wed, Oct 21");
    expect(
      recentSessionLine({ when: "Wed, Oct 21", day: "B", exercises: 5, energy: 4 }),
    ).toBe("Wed, Oct 21 · Day B · 5 exercises · energy 4");
  });

  it("marks a level change on the movement series", () => {
    const series = groupMovementSeries([
      { date: "2026-10-14", patternId: "squat", exerciseId: "SQ1", exerciseName: "Box Squat", level: 1, unit: "reps", top: 10, targetMax: 12 },
      { date: "2026-10-14", patternId: "squat", exerciseId: "SQ1", exerciseName: "Box Squat", level: 1, unit: "reps", top: 12, targetMax: 12 },
      { date: "2026-10-16", patternId: "squat", exerciseId: "SQ2", exerciseName: "Bodyweight Squat", level: 2, unit: "reps", top: 8, targetMax: 12 },
    ]);
    expect(series).toHaveLength(1);
    expect(series[0]?.points.map((point) => [point.date, point.top, point.levelChange])).toEqual([
      ["2026-10-14", 12, false],
      ["2026-10-16", 8, true],
    ]);
  });

  it("writes an invite with a one-tap link and blocks a stale delete", () => {
    const message = inviteMessage("Jon", "https://tracker.example/api/auth/magic-link/verify?token=abc");
    expect(message.subject).toBe("Jon invited you to Calisthenics Tracker");
    expect(message.text).toContain("Tap to sign in: https://tracker.example/api/auth/magic-link/verify?token=abc");
    expect(message.text).toContain("72 hours");
    expect(hashMagicToken("abc")).toHaveLength(43);
    expect(deleteAccountError("delete", 1000)).toMatch(/DELETE/);
    expect(deleteAccountError("DELETE", 13 * 60 * 60 * 1000)).toMatch(/12 hours/);
    expect(deleteAccountError("DELETE", 1000)).toBeNull();
  });

  it("filters the library without a round trip", () => {
    const items = [
      { name: "Wall Push-Up", patternId: "push", patternLabel: "Push", cues: ["Straight line"] },
      { name: "Box Squat", patternId: "squat", patternLabel: "Squat", cues: ["Sit back"] },
      { name: "Wall Slide", patternId: "warmup", patternLabel: "Warm-up", cues: ["Ribs down"] },
    ];
    expect(items.filter((item) => matchesLibrary(item, "wall", "all")).map((item) => item.name)).toEqual([
      "Wall Push-Up",
      "Wall Slide",
    ]);
    expect(items.filter((item) => matchesLibrary(item, "wall", "push")).map((item) => item.name)).toEqual(["Wall Push-Up"]);
    expect(items.filter((item) => matchesLibrary(item, "", "warmup")).map((item) => item.name)).toEqual(["Wall Slide"]);
  });
});
