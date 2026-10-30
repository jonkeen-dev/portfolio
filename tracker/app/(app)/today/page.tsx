import { sessionDoneLine } from "@/lib/copy";
import { displayTitle, weekdayName } from "@/lib/plan";
import { currentProfile, currentSession } from "@/lib/session";
import { loadToday, todayIso } from "@/lib/today";
import { isIsoDate } from "@/lib/validators";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressSegments } from "@/components/ui/progress-segments";

import { AssessmentStepper } from "./assessment";
import { CoachNote, DateControl, LevelUpCard } from "./bits";
import { WorkoutView } from "./workout";

export const metadata = { title: "Today" };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ on?: string; error?: string; test?: string; saved?: string }>;
}) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const query = await searchParams;
  const today = todayIso(profile.timezone);
  const requested = query.on && isIsoDate(query.on) ? query.on : today;
  const model = await loadToday(session.user.id, requested);
  if (!model) return null;
  const title = model.rest || model.outside ? "Rest day" : displayTitle(model.title);
  const eyebrow = (
    <>
      <span className="nowrap">{weekdayName(model.date)}</span>
      <span className="nowrap">Week {model.week} of 12</span>
      {model.phaseName ? <span className="nowrap">{model.phaseName}</span> : null}
      {model.day ? <span className="nowrap">Day {model.day}</span> : null}
    </>
  );
  const doneCount = model.items.filter((item) => item.logged.every((value) => typeof value === "number")).length;
  const ready = model.completed
    ? model.suggestions.filter((item) => item.status === "READY" && item.suggestedExerciseId && item.suggestedName)
    : [];
  const testIndex = Number(query.test ?? "0");
  const warmup = model.prep.filter((entry) => entry.kind === "warmup");
  const cooldown = model.prep.filter((entry) => entry.kind === "cooldown");

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <DateControl date={model.date} today={today} />
      {query.error ? (
        <p className="alert" role="alert">
          {query.error}
        </p>
      ) : null}
      {model.items.length > 0 ? (
        <ProgressSegments
          done={doneCount}
          total={model.items.length}
          label={`${doneCount} of ${model.items.length} done · about ${model.estMinutes || 25} minutes`}
        />
      ) : null}
      {model.completed ? <p className="done-line">{sessionDoneLine(model.items)}</p> : null}
      {model.focus ? <p>{model.focus}</p> : null}
      {model.coachNote ? <CoachNote week={model.week} note={model.coachNote} /> : null}
      {model.isDeload ? <p>Lighter week, so level-ups wait until next week.</p> : null}
      {model.outside ? (
        <section className="card">
          <p>This date is outside your 12 weeks.</p>
          <ButtonLink href="/today" variant="primary">
            Back to today
          </ButtonLink>
        </section>
      ) : null}
      {model.rest && !model.outside ? (
        <>
          <p>Nothing planned today. A walk is a good idea.</p>
          {model.nextSession ? (
            <section className="card">
              <h2>
                Next: {model.nextSession.weekday} · Day {model.nextSession.day} · {model.nextSession.title} · about{" "}
                {model.nextSession.minutes} minutes
              </h2>
              <ButtonLink href={`/today?on=${model.nextSession.date}`} variant="secondary">
                Preview
              </ButtonLink>
            </section>
          ) : null}
          {model.weekDots.length > 0 ? (
            <section className="card" aria-label="This week">
              <h2>This week</h2>
              <ul className="week-dots">
                {model.weekDots.map((dot) => (
                  <li key={dot.date}>
                    <span className={dot.done ? "dot is-done" : "dot"} aria-hidden="true" />
                    {dot.label}
                    {dot.done ? <span className="sr-only">, done</span> : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}

      {ready.map((item) => (
        <LevelUpCard
          key={item.patternId}
          date={model.date}
          patternId={item.patternId}
          patternName={model.items.find((entry) => entry.patternId === item.patternId)?.patternName ?? item.exerciseName}
          exerciseName={item.exerciseName}
          suggestedName={item.suggestedName ?? ""}
          suggestedId={item.suggestedExerciseId ?? ""}
          reason={item.reason}
        />
      ))}

      {model.tests.length > 0 ? (
        <AssessmentStepper
          date={model.date}
          phase={model.sessionType === "retest" ? "retest" : "baseline"}
          tests={model.tests}
          choices={model.exerciseChoices}
          startIndex={Number.isFinite(testIndex) && testIndex > 0 ? testIndex : 0}
          saved={query.saved === "1"}
        />
      ) : null}

      {warmup.length > 0 ? <PrepList title={`Warm-up · ${warmup.length} moves, about 5 minutes`} items={warmup} /> : null}
      {model.items.length > 0 ? (
        <WorkoutView
          date={model.date}
          day={model.day}
          sessionType={model.sessionType}
          items={model.items}
          completed={model.completed}
        />
      ) : null}
      {cooldown.length > 0 ? <PrepList title={`Cool-down · ${cooldown.length} moves, about 5 minutes`} items={cooldown} /> : null}
      {model.completed && model.nextSession ? (
        <p>
          Next session: {model.nextSession.weekday} · Day {model.nextSession.day}
        </p>
      ) : null}
    </>
  );
}

function PrepList({ title, items }: { title: string; items: Array<{ name: string; detail: string }> }) {
  return (
    <details className="card">
      <summary>{title}</summary>
      <ul className="prose-list">
        {items.map((entry) => (
          <li key={`${entry.name}-${entry.detail}`}>
            <label className="choice">
              <input type="checkbox" /> {entry.name}
              {entry.detail ? ` — ${entry.detail}` : ""}
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}
