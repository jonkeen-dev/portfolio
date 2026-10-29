"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

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
        <Button type="button" onClick={() => setPlay(true)}>
          Play demo: {title}
        </Button>
      )}
      <a href={watchUrl}>Open on YouTube</a>
    </div>
  );
}
