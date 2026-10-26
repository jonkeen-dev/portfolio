import { adherencePercent, insights } from "@/lib/engine/analytics";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { currentProfile, currentSession } from "@/lib/session";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const asOf = todayIso(profile.timezone);
  const dal = createDal(getDatabase().db);
  const [dashboard, records, suggestions] = await Promise.all([
    dal.trainingDashboard(session.user.id, asOf),
    dal.records(session.user.id, asOf),
    dal.movementSuggestions(session.user.id, asOf),
  ]);
  if (!dashboard) return null;
  const percent = adherencePercent(dashboard.adherence);
  const summary = `${dashboard.sessionsCompleted} of ${dashboard.sessionsScheduled} sessions (${percent}%). Streak ${dashboard.currentStreak}. ${dashboard.totalReps} reps and ${dashboard.holdMinutes.toFixed(1)} minutes of holds.`;
  const notes = insights({
    readyNames: suggestions.filter((item) => item.status === "READY" && item.suggestedName).map((item) => item.suggestedName!),
    recentTotals: [],
    adherenceLastTwoWeeks: null,
    newRecords: [],
  });
  const through = dashboard.weeks.slice(0, Math.max(1, weeksThrough(dashboard)));

  return (
    <>
      <h1>Progress</h1>
      <p>{summary}</p>
      <dl className="card">
        <div>
          <dt>Sessions</dt>
          <dd>
            {dashboard.sessionsCompleted} / {dashboard.sessionsScheduled}
          </dd>
        </div>
        <div>
          <dt>Adherence</dt>
          <dd>{percent}%</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>
            {dashboard.currentStreak} (best {dashboard.bestStreak})
          </dd>
        </div>
        <div>
          <dt>Level-ups ready</dt>
          <dd>{dashboard.levelUpsReady}</dd>
        </div>
      </dl>
      {notes.map((note) => (
        <p key={note.id}>{note.text}</p>
      ))}
      <h2>Weekly sessions</h2>
      <div role="img" aria-label={summary}>
        {through.map((week) => (
          <div className="bar-track" key={week.week}>
            <span>Week {week.week}</span>
            <div className="bar" style={{ width: `${Math.max(4, Math.min(100, (week.sessions / 3) * 100))}%` }} />
            <span>{week.sessions}</span>
          </div>
        ))}
      </div>
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
          {through.map((week) => {
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
      <h2>Best sets</h2>
      {records.length === 0 ? <p>No sets yet.</p> : null}
      <ul>
        {records.map((row) => (
          <li key={row.exerciseId}>
            {row.exerciseName}: {row.bestSet} on {row.bestSetDate}
          </li>
        ))}
      </ul>
      <p className="muted">Showing training through {asOf}. The chart stops at the latest week with a session.</p>
    </>
  );
}

function weeksThrough(dashboard: { weeks: Array<{ week: number; sessions: number }> }): number {
  let last = 1;
  dashboard.weeks.forEach((week) => {
    if (week.sessions > 0) last = week.week;
  });
  return last;
}
