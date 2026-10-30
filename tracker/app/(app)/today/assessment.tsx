"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { Stepper } from "@/components/ui/stepper";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveAssessmentItem } from "@/lib/actions";

type Choice = { id: string; name: string; patternId: string; level: number };
type Test = { id: string; name: string; patternId: string | null; protocol: string; unit: string };

export function AssessmentStepper({
  date,
  phase,
  tests,
  choices,
  startIndex,
  saved,
}: {
  date: string;
  phase: "baseline" | "retest";
  tests: Test[];
  choices: Choice[];
  startIndex: number;
  saved: boolean;
}) {
  const [value, setValue] = useState(0);
  const [exerciseId, setExerciseId] = useState("");
  const test = tests[startIndex];
  if (saved || !test) {
    return (
      <section className="card">
        <h2>{phase === "retest" ? "Retest saved." : "Baseline saved. Your starting levels are set."}</h2>
        <p>You can change a level later from Ladders.</p>
      </section>
    );
  }
  const ladder = test.patternId ? choices.filter((choice) => choice.patternId === test.patternId) : [];
  const total = Math.max(1, ...ladder.map((choice) => choice.level));
  return (
    <form className="stack" action={saveAssessmentItem}>
      <p className="eyebrow">
        Test {startIndex + 1} of {tests.length} · {test.name}
      </p>
      <h2>{test.name}</h2>
      <p>{test.protocol}</p>
      <input type="hidden" name="phase" value={phase} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="testId" value={test.id} />
      <input type="hidden" name="index" value={String(startIndex)} />
      <input type="hidden" name="total" value={String(tests.length)} />
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="result" value={String(value)} />
      {ladder.length > 0 ? (
        <div className="stack" role="radiogroup" aria-label="Starting exercise">
          {ladder.map((choice) => {
            const selected = exerciseId === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`choice-card${selected ? " is-selected" : ""}`}
                onClick={() => setExerciseId(choice.id)}
              >
                <MiniLadder level={choice.level} total={total} />
                <span>
                  Level {choice.level}: {choice.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <Stepper id={`result-${test.id}`} value={value} onChange={setValue} unit={test.unit || "reps"} label="Result" />
      <SubmitButton>Save and next</SubmitButton>
      <ButtonLink href={startIndex + 1 >= tests.length ? `/today?on=${date}&saved=1` : `/today?on=${date}&test=${startIndex + 1}`} variant="ghost">
        Skip this test
      </ButtonLink>
    </form>
  );
}
