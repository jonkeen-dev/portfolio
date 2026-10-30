import { asc } from "drizzle-orm";
import Link from "next/link";

import { MovementList, type MovementView } from "@/components/progress-board";
import { Keep } from "@/components/ui/keep";
import { PageHeader } from "@/components/ui/page-header";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { exercises, patterns } from "@/lib/db/schema";
import { athleteWeek } from "@/lib/engine/dates";
import { formatCalendarDate, formatWeekdayDate } from "@/lib/format";
import { formatHoldClock, formatReps, groupMovementSeries, recentSessionLine, type SeriesPoint } from "@/lib/progress";
import { currentProfile, currentSession } from "@/lib/session";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Progress" };

const ORDER = ["push", "pull", "squat", "hinge", "core", "lateral_core"];

export default async function ProgressPage() {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const asOf = todayIso(profile.timezone);
  const db = getDatabase().db;
  const dal = createDal(db);
  const [dashboard, records, seriesRows, sessions, patternRows, exerciseRows, levels] = await Promise.all([
    dal.trainingDashboard(session.user.id, asOf),
    dal.records(session.user.id, asOf),
    dal.trainingSeries(session.user.id, asOf),
    dal.finishedSessions(session.user.id, asOf),
    db.select().from(patterns).orderBy(asc(patterns.sort)),
    db.select().from(exercises),
    dal.currentLevels(session.user.id),
  ]);
  if (!dashboard) return null;
  const hasNumbers = dashboard.sessionsCompleted > 0 || records.length > 0 || seriesRows.length > 0;
  const summary = `${dashboard.sessionsCompleted} of ${dashboard.sessionsScheduled} sessions. Streak ${dashboard.currentStreak}, best ${dashboard.bestStreak}. ${formatReps(dashboard.totalReps)} reps and ${formatHoldClock(dashboard.holdMinutes * 60)} of holds.`;
  const currentWeek = athleteWeek(asOf, profile.startDate);
  const names = new Map(patternRows.map((row) => [row.id, row.name]));
  const grouped = groupMovementSeries(
    seriesRows.map(
      (row): SeriesPoint => ({
        date: row.date,
        patternId: row.pattern_id,
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name,
        level: Number(row.level),
        unit: row.unit,
        top: Number(row.top),
        targetMax: Number(row.target_max),
      }),
    ),
  );
  const byPattern = new Map(grouped.map((series) => [series.patternId, series]));
  const movements: MovementView[] = ORDER.map((patternId) => {
    const ladder = exerciseRows.filter(
      (row) => row.patternId === patternId && row.equipment !== "kettlebell" && (profile.hasBar || row.equipment !== "bar"),
    );
    const level = levels.find((item) => item.patternId === patternId);
    const series = byPattern.get(patternId);
    return {
      patternId,
      name: names.get(patternId) ?? patternId,
      level: level?.level ?? 0,
      rungTotal: ladder.reduce((max, row) => Math.max(max, row.level), 1),
      exerciseName: level?.exerciseName ?? series?.points.at(-1)?.exerciseName ?? null,
      unit: series?.unit ?? "reps",
      points: (series?.points ?? []).map((point) => ({
        date: point.date,
        exerciseName: point.exerciseName,
        top: point.top,
        targetMax: point.targetMax,
        levelChange: point.levelChange,
      })),
    };
  });

  return (
    <>
      <PageHeader title="Progress" />
      <p>
        <Link href="/partner">Your partner</Link>
      </p>
      {!hasNumbers ? <p>Your numbers show up here after your first session.</p> : null}
      {hasNumbers ? (
        <>
          <dl className="stats">
            <div>
              <dt>Sessions</dt>
              <dd>
                {dashboard.sessionsCompleted} <span className="stat-aside">of {dashboard.sessionsScheduled}</span>
              </dd>
            </div>
            <div>
              <dt>Streak</dt>
              <dd>
                {dashboard.currentStreak} <span className="stat-aside">(best {dashboard.bestStreak})</span>
              </dd>
            </div>
            <div>
              <dt>Total reps</dt>
              <dd>{formatReps(dashboard.totalReps)}</dd>
            </div>
            <div>
              <dt>Holds</dt>
              <dd>{formatHoldClock(dashboard.holdMinutes * 60)}</dd>
            </div>
          </dl>
          <h2>By movement</h2>
          <MovementList movements={movements} />
          <h2>Weekly sessions</h2>
          <div className="week-chart" role="img" aria-label={summary}>
            {dashboard.weeks.map((week) => (
              <div key={week.week} className={week.week === currentWeek ? "week-col is-current" : "week-col"}>
                <div
                  className="week-bar"
                  style={{ height: `${Math.max(week.sessions === 0 ? 4 : 8, Math.min(100, (week.sessions / 3) * 100))}%` }}
                />
                <span className="week-label">{week.week}</span>
                <span className="sr-only">
                  Week {week.week}, {week.sessions === 1 ? "1 session" : `${week.sessions} sessions`}
                </span>
              </div>
            ))}
          </div>
          <div className="table-scroll">
          <table>
            <caption>Sessions and volume by week</caption>
            <thead>
              <tr>
                <th scope="col">Week</th>
                <th scope="col">Sessions</th>
                <th scope="col">Reps</th>
                <th scope="col">Hold seconds</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.weeks.map((week) => {
                const reps = Object.values(week.repsByPattern).reduce((sum, value) => sum + value, 0);
                return (
                  <tr key={week.week}>
                    <th scope="row">{week.week}</th>
                    <td>{week.sessions}</td>
                    <td>{reps}</td>
                    <td>{week.holdSeconds}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <h2>Recent sessions</h2>
          {sessions.length === 0 ? <p>Finished sessions show up here.</p> : null}
          <ul className="plain-list">
            {sessions.map((row) => (
              <li key={`${row.date}-${row.day ?? ""}`}>
                <Link className="session-link" href={`/today?on=${row.date}`}>
                  <span className="session-copy">
                    <Keep
                      text={recentSessionLine({
                        when: formatWeekdayDate(row.date),
                        day: row.day,
                        exercises: row.exercises,
                        energy: row.energy,
                      })}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <h2>Best sets</h2>
          {records.length === 0 ? <p>No sets yet.</p> : null}
          <ul className="plain-list">
            {records.map((row) => (
              <li key={row.exerciseId}>
                <Keep text={`${row.exerciseName} · ${row.bestSet} · ${formatCalendarDate(row.bestSetDate)}`} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
