"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PublicProfileView, type SharedLevel, type SharedStats } from "@/components/public-profile-view";
import { Sheet } from "@/components/ui/sheet";

export function CopyLink({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [note, setNote] = useState("");
  return (
    <div className="stack">
      <p className="url-text">{url}</p>
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setNote("Link copied.");
          } catch {
            setNote("Select the link above and copy it.");
          }
        }}
      >
        {label}
      </Button>
      {note ? <p role="status">{note}</p> : null}
    </div>
  );
}

export function SharePreview({
  title,
  email,
  stats,
  levels,
  sessions,
}: {
  title: string;
  email: string | null;
  stats: SharedStats | null;
  levels: SharedLevel[] | null;
  sessions: { key: string; line: string }[] | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Preview
      </Button>
      {open ? (
        <Sheet open onOpenChange={setOpen} title="Preview" description="A preview of your public page.">
          <PublicProfileView
            heading="h2"
            title={title}
            email={email}
            stats={stats}
            levels={levels}
            sessions={sessions}
            banner="This is what others see."
          />
        </Sheet>
      ) : null}
    </>
  );
}
