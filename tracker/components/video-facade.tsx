"use client";

import { useState } from "react";

export function VideoFacade({ youtubeId, title, watchUrl }: { youtubeId: string; title: string; watchUrl: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="stack">
      {play ? (
        <iframe
          className="video"
          title={title}
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button className="tap" type="button" onClick={() => setPlay(true)}>
          Play demo: {title}
        </button>
      )}
      <a href={watchUrl}>Open on YouTube</a>
    </div>
  );
}
