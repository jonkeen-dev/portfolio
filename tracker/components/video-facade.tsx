"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function VideoFacade({
  youtubeId,
  title,
  watchUrl,
  duration,
}: {
  youtubeId: string;
  title: string;
  watchUrl: string;
  duration?: string | null;
}) {
  const [play, setPlay] = useState(false);
  const label = duration ? `Play demo (${duration})` : "Play demo";
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
        <Button type="button" onClick={() => setPlay(true)} aria-label={`${label}: ${title}`}>
          {label}
        </Button>
      )}
      <a href={watchUrl}>Open on YouTube</a>
    </div>
  );
}
