"use client";

import { useSyncExternalStore } from "react";

const COMMON = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London"];

function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function TimezoneField() {
  const zone = useSyncExternalStore(
    () => () => {},
    deviceZone,
    () => "UTC",
  );
  const options = COMMON.includes(zone) ? COMMON : [zone, ...COMMON];
  return (
    <label htmlFor="timezone">
      Timezone
      <select id="timezone" name="timezone" defaultValue={zone} key={zone}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
