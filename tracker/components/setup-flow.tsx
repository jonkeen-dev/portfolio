"use client";

import { useState } from "react";

import { TimezoneField } from "@/components/timezone-field";
import { Button } from "@/components/ui/button";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressSegments } from "@/components/ui/progress-segments";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveSetup } from "@/lib/actions";
import { formatWeekdayDate } from "@/lib/format";

export function SetupFlow({ defaultStart }: { defaultStart: string }) {
  const [step, setStep] = useState(1);
  const [start, setStart] = useState(defaultStart);
  const titles = ["How this works", "Your details", "You're set"] as const;

  return (
    <>
      <PageHeader title={titles[step - 1] ?? "Setup"} />
      <ProgressSegments done={step - 1} total={3} label={`Step ${step} of 3`} />
      <form className="stack" action={saveSetup}>
        <div className="stack" hidden={step !== 1}>
          <MiniLadder level={2} total={6} />
          <ul className="prose-list">
            <li>Three short full-body sessions a week, about 25 minutes.</li>
            <li>Each movement has a ladder of levels. You start low and move up when the work gets easy.</li>
            <li>Weeks 4 and 8 are lighter. Week 12 ends with a retest.</li>
          </ul>
          <Button type="button" variant="primary" onClick={() => setStep(2)}>
            Next
          </Button>
        </div>
        <div className="stack" hidden={step !== 2}>
          <label htmlFor="displayName">
            Name (optional)
            <input id="displayName" name="displayName" autoComplete="name" maxLength={80} />
          </label>
          <label htmlFor="startDate">
            Start date
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <p className="meta">Monday works best. Week 1 starts with a short test.</p>
          <fieldset className="choice-stack">
            <legend>Do you have a pull-up bar?</legend>
            <label className="choice-card">
              <input type="radio" name="hasBar" value="yes" />
              <span>Yes</span>
            </label>
            <label className="choice-card">
              <input type="radio" name="hasBar" value="no" defaultChecked />
              <span>Not yet</span>
            </label>
          </fieldset>
          <p className="meta">This changes the pull ladder.</p>
          <fieldset>
            <legend>Units</legend>
            <label className="choice">
              <input type="radio" name="units" value="lb" defaultChecked /> Pounds (lb)
            </label>
            <label className="choice">
              <input type="radio" name="units" value="kg" /> Kilograms (kg)
            </label>
          </fieldset>
          <TimezoneField />
          <div className="action-row">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (!start) return;
                setStep(3);
              }}
            >
              Next
            </Button>
          </div>
        </div>
        <div className="stack" hidden={step !== 3}>
          <p>Your first session is {formatSessionDay(start)}: a short test to find your starting levels.</p>
          <div className="action-row">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <SubmitButton>Go to Today</SubmitButton>
          </div>
        </div>
      </form>
    </>
  );
}

function formatSessionDay(iso: string): string {
  const shown = formatWeekdayDate(iso);
  return shown.replace(/^Mon,/, "Monday,").replace(/^Tue,/, "Tuesday,").replace(/^Wed,/, "Wednesday,").replace(/^Thu,/, "Thursday,").replace(/^Fri,/, "Friday,").replace(/^Sat,/, "Saturday,").replace(/^Sun,/, "Sunday,");
}
