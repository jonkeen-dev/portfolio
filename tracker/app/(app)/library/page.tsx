import { asc, eq } from "drizzle-orm";

import { VideoFacade } from "@/components/video-facade";
import { getDatabase } from "@/lib/db";
import { exercises, videos } from "@/lib/db/schema";

export const metadata = { title: "Library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const db = getDatabase().db;
  const [exerciseRows, videoRows] = await Promise.all([
    db.select().from(exercises).orderBy(asc(exercises.name)),
    db.select().from(videos).where(eq(videos.role, "primary")),
  ]);
  const primary = new Map(videoRows.map((row) => [row.exerciseId, row]));
  const shown = exerciseRows.filter((row) => {
    if (row.equipment === "kettlebell") return false;
    if (!query) return true;
    return row.name.toLowerCase().includes(query) || row.patternId.includes(query) || row.id.toLowerCase().includes(query);
  });

  return (
    <>
      <h1>Library</h1>
      <form className="stack" action="/library" method="get">
        <label htmlFor="q">
          Search exercises
          <input id="q" name="q" defaultValue={q ?? ""} />
        </label>
        <button className="tap" type="submit">
          Search
        </button>
      </form>
      {shown.map((row) => {
        const video = primary.get(row.id);
        return (
          <article key={row.id} className="card">
            <h2>
              {row.name} <span className="muted">level {row.level}</span>
            </h2>
            <p>{row.description}</p>
            {row.cues.length > 0 ? (
              <ul>
                {row.cues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            ) : null}
            {row.safetyNote ? <p>{row.safetyNote}</p> : null}
            {video?.youtubeId && video.status === "ok" ? (
              <VideoFacade youtubeId={video.youtubeId} title={video.title} watchUrl={video.url} />
            ) : (
              <p>Demo unavailable.</p>
            )}
          </article>
        );
      })}
    </>
  );
}
