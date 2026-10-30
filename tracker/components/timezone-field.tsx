"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

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
  const [custom, setCustom] = useState<string | null>(null);
  const value = custom ?? zone;
  const options = COMMON.includes(value) ? COMMON : [value, ...COMMON];
  return (
    <div className="stack">
      <p>
        Timezone: <span className="meta">{value}</span>
      </p>
      {custom === null ? <input type="hidden" name="timezone" value={value} /> : null}
      {custom === null ? (
        <Button type="button" variant="ghost" onClick={() => setCustom(zone)}>
          Change
        </Button>
      ) : (
        <label htmlFor="timezone">
          Timezone
          <select id="timezone" name="timezone" value={custom} onChange={(event) => setCustom(event.target.value)}>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
