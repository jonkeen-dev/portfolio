"use client";

import { VideoFacade } from "@/components/video-facade";
import { Keep } from "@/components/ui/keep";

export type ExerciseDetailModel = {
  id: string;
  description: string;
  cues: string[];
  mistakes: string[];
  safetyNote: string | null;
  regressionId: string | null;
  progressionId: string | null;
  video: { youtubeId: string; title: string; watchUrl: string; duration: string | null } | null;
};

export function ExerciseDetail({
  item,
  names,
  mode,
  onJump,
}: {
  item: ExerciseDetailModel;
  names: Record<string, string>;
  mode: "full" | "howto";
  onJump?: (id: string) => void;
}) {
  const cues = mode === "howto" ? item.cues.slice(0, 3) : item.cues;
  const easier = item.regressionId ? names[item.regressionId] : undefined;
  const harder = item.progressionId ? names[item.progressionId] : undefined;
  return (
    <div className="stack">
      {item.description ? (
        <p>
          <Keep text={item.description} />
        </p>
      ) : null}
      {cues.length > 0 ? (
        <ul className="prose-list">
          {cues.map((cue) => (
            <li key={cue}>
              <Keep text={cue} />
            </li>
          ))}
        </ul>
      ) : null}
      {mode === "howto" && item.cues.length > 3 ? (
        <p className="meta">
          <a href={`/library#${item.id}`}>The rest of the cues are in the library.</a>
        </p>
      ) : null}
      {mode === "full" && item.mistakes.length > 0 ? (
        <div>
          <h3>Watch out for</h3>
          <ul className="prose-list">
            {item.mistakes.map((mistake) => (
              <li key={mistake}>
                <Keep text={mistake} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {item.safetyNote ? (
        <p className="callout">
          <Keep text={item.safetyNote} />
        </p>
      ) : null}
      {mode === "full" && (easier || harder) ? (
        <p>
          {easier && item.regressionId ? (
            <>
              Easier: <Jump id={item.regressionId} name={easier} onJump={onJump} />
            </>
          ) : null}
          {easier && harder ? " / " : null}
          {harder && item.progressionId ? (
            <>
              Harder: <Jump id={item.progressionId} name={harder} onJump={onJump} />
            </>
          ) : null}
        </p>
      ) : null}
      {item.video ? (
        <VideoFacade
          youtubeId={item.video.youtubeId}
          title={item.video.title}
          watchUrl={item.video.watchUrl}
          duration={item.video.duration}
        />
      ) : (
        <p>Demo unavailable.</p>
      )}
    </div>
  );
}

function Jump({ id, name, onJump }: { id: string; name: string; onJump?: (id: string) => void }) {
  if (onJump) {
    return (
      <button type="button" className="linkish" onClick={() => onJump(id)}>
        <Keep text={name} />
      </button>
    );
  }
  return (
    <a className="tap" href={`/library#${id}`}>
      <Keep text={name} />
    </a>
  );
}
