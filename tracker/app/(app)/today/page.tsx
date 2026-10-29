import { acceptLevel, completeSession, saveAssessment } from "@/lib/actions";
import { sessionDoneLine } from "@/lib/copy";
import { currentProfile, currentSession } from "@/lib/session";
import { loadToday, todayIso } from "@/lib/today";
import { isIsoDate } from "@/lib/validators";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressSegments } from "@/components/ui/progress-segments";
import { SubmitButton } from "@/components/ui/submit-button";

import { Logger } from "./logger";

export const metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ on?: string; error?: string }> }) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const query = await searchParams;
  const today = todayIso(profile.timezone);
  const requested = query.on && isIsoDate(query.on) ? query.on : today;
  const model = await loadToday(session.user.id, requested);
  if (!model) return null;
  const ready = model.completed
    ? model.suggestions.filter((item) => item.status === "READY" && item.suggestedExerciseId && item.suggestedName)
    : [];
  const doneCount = model.items.filter((item) => item.logged.every((value) => typeof value === "number")).length;
  const eyebrow = [`Week ${model.week}`, model.phaseName, model.day ? `Day ${model.day}` : null].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader eyebrow={eyebrow || undefined} title="Today" />
      <form className="row" action="/today" method="get">
        <label htmlFor="on">
          Session date
          <input id="on" name="on" type="date" defaultValue={model.date} />
        </label>
        <SubmitButton variant="secondary" pendingLabel="Showing…">
          Show date
        </SubmitButton>
        {model.date !== today ? <ButtonLink href="/today">Back to today</ButtonLink> : null}
      </form>
      {query.error ? (
        <p className="alert" role="alert">
          {query.error}
        </p>
      ) : null}
      <h2>{model.title}</h2>
      {model.items.length > 0 ? (
        <ProgressSegments
          done={doneCount}
          total={model.items.length}
          label={`${doneCount} of ${model.items.length} exercises done`}
        />
      ) : null}
      {model.focus ? <p>{model.focus}</p> : null}
      {model.outside ? <p>This date is outside your 12 weeks.</p> : null}
      {model.rest && !model.outside ? <p>Nothing planned today. A walk is a good idea.</p> : null}
      {model.isDeload ? <p>Lighter week, so level-ups wait until next week.</p> : null}
      {model.coachNote ? <p className="muted">{model.coachNote}</p> : null}

      {ready.map((item) => {
        const applied = model.levels.some(
          (level) => level.patternId === item.patternId && level.exerciseId === item.suggestedExerciseId,
        );
        return (
          <section key={item.patternId} className="card" aria-labelledby={`ready-${item.patternId}`}>
            <h2 id={`ready-${item.patternId}`}>{applied ? "Level saved" : "Ready to level up"}</h2>
            <p>
              {applied
                ? `You're on ${item.suggestedName}.`
                : `${item.exerciseName} can move to ${item.suggestedName}.`}
            </p>
            <p>{item.reason}</p>
            {item.tooHard ? <p>{item.tooHard.message}</p> : null}
            {applied ? null : (
              <form action={acceptLevel}>
                <input type="hidden" name="date" value={model.date} />
                <input type="hidden" name="patternId" value={item.patternId} />
                <input type="hidden" name="toExerciseId" value={item.suggestedExerciseId ?? ""} />
                <input type="hidden" name="next" value={`/today?on=${model.date}`} />
                <SubmitButton>Accept {item.suggestedName}</SubmitButton>
              </form>
            )}
          </section>
        );
      })}

      {model.prep.length > 0 ? (
        <details className="card">
          <summary>Warm-up and cool-down</summary>
          <ul className="prose-list">
            {model.prep.map((entry) => (
              <li key={`${entry.name}-${entry.detail}`}>
                {entry.name}
                {entry.detail ? ` — ${entry.detail}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {model.tests.length > 0 ? (
        <form className="stack" action={saveAssessment}>
          <h2>{model.sessionType === "retest" ? "Retest" : "Baseline"}</h2>
          <input type="hidden" name="phase" value={model.sessionType === "retest" ? "retest" : "baseline"} />
          <input type="hidden" name="date" value={model.date} />
          {model.tests.map((test) => (
            <fieldset key={test.id} className="card">
              <legend>{test.name}</legend>
              <p className="muted">{test.protocol}</p>
              {test.patternId ? (
                <label htmlFor={`exercise-${test.id}`}>
                  Starting exercise
                  <select id={`exercise-${test.id}`} name={`exercise:${test.id}`} defaultValue="">
                    <option value="">Not tested</option>
                    {model.exerciseChoices
                      .filter((choice) => choice.patternId === test.patternId)
                      .map((choice) => (
                        <option key={choice.id} value={choice.id}>
                          Level {choice.level}: {choice.name}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
              <label htmlFor={`result-${test.id}`}>
                Result ({test.unit})
                <input id={`result-${test.id}`} name={`result:${test.id}`} inputMode="decimal" />
              </label>
            </fieldset>
          ))}
          <SubmitButton>Save assessment</SubmitButton>
        </form>
      ) : null}

      {model.items.length > 0 ? (
        <Logger date={model.date} day={model.day} sessionType={model.sessionType} items={model.items} />
      ) : null}

      {model.items.length > 0 && !model.completed ? (
        <form className="stack" action={completeSession}>
          <input type="hidden" name="date" value={model.date} />
          <input type="hidden" name="sessionType" value={model.sessionType} />
          <label htmlFor="energy">
            Energy (optional)
            <select id="energy" name="energy" defaultValue="">
              <option value="">Skip</option>
              <option value="1">1, very flat</option>
              <option value="2">2</option>
              <option value="3">3, okay</option>
              <option value="4">4</option>
              <option value="5">5, great</option>
            </select>
          </label>
          <SubmitButton>Finish session</SubmitButton>
        </form>
      ) : null}
      {model.completed ? <p>{sessionDoneLine(model.items)}</p> : null}
    </>
  );
}
