import { MiniLadder } from "@/components/ui/mini-ladder";

export type SharedLevel = {
  patternId: string;
  patternName: string;
  exerciseName: string;
  level: number;
  rungTotal: number;
};

export type SharedStats = {
  sessions: string;
  sessionsAside: string;
  streak: string;
  streakAside: string;
  reps: string;
  holds: string;
};

export function PublicProfileView({
  title,
  email,
  stats,
  levels,
  sessions,
  banner,
  heading = "h1",
}: {
  title: string;
  email: string | null;
  stats: SharedStats | null;
  levels: SharedLevel[] | null;
  sessions: { key: string; line: string }[] | null;
  banner?: string;
  heading?: "h1" | "h2";
}) {
  const Title = heading;
  return (
    <div className="stack">
      {banner ? <p className="callout">{banner}</p> : null}
      <header className="page-header">
        <Title>{title}</Title>
        <p>
          <span className="tag">View only</span>
        </p>
      </header>
      {email ? <p>{email}</p> : null}
      {stats ? (
        <section className="card" aria-labelledby="stats">
          <h2 id="stats">Stats</h2>
          <dl className="stats">
            <div>
              <dt>Sessions</dt>
              <dd>
                {stats.sessions} <span className="stat-aside">{stats.sessionsAside}</span>
              </dd>
            </div>
            <div>
              <dt>Streak</dt>
              <dd>
                {stats.streak} <span className="stat-aside">{stats.streakAside}</span>
              </dd>
            </div>
            <div>
              <dt>Total reps</dt>
              <dd>{stats.reps}</dd>
            </div>
            <div>
              <dt>Holds</dt>
              <dd>{stats.holds}</dd>
            </div>
          </dl>
        </section>
      ) : null}
      {levels && levels.length > 0 ? (
        <section className="stack" aria-labelledby="levels">
          <h2 id="levels">Ladders</h2>
          {levels.map((level) => (
            <article key={level.patternId} className="card exercise-head">
              <MiniLadder level={level.level} total={level.rungTotal} />
              <div>
                <h3 className="row-title">{level.patternName}</h3>
                <p className="meta">
                  {level.exerciseName} · level {level.level} of {level.rungTotal}
                </p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      {sessions && sessions.length > 0 ? (
        <section aria-labelledby="recent">
          <h2 id="recent">Recent sessions</h2>
          <ul className="plain-list">
            {sessions.map((session) => (
              <li key={session.key}>{session.line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
