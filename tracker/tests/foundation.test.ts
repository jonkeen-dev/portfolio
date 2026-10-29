import { describe, expect, it } from "vitest";

import { loadWeeks } from "../lib/content";
import { movementStatusLine, sessionDoneLine, setButtonName } from "../lib/copy";
import { formatCalendarDate, formatZonedDateTime } from "../lib/format";
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
