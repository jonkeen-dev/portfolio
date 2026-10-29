"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { addDays } from "@/lib/engine/dates";
import { acceptLevel } from "@/lib/actions";
import { formatCalendarDate } from "@/lib/format";
import { useRouter } from "next/navigation";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function useStoredFlag(key: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => false,
  );
}

export function DateControl({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const previous = addDays(date, -1);
  const next = addDays(date, 1);
  return (
    <div className="date-row">
      <ButtonLink href={`/today?on=${previous}`} aria-label="Previous day">
        ‹
      </ButtonLink>
      <label className="date-field">
        <span className="sr-only">Session date</span>
        <input
          type="date"
          aria-label="Session date"
          value={date}
          onChange={(event) => {
            if (event.target.value) router.push(`/today?on=${event.target.value}`);
          }}
        />
      </label>
      <ButtonLink href={`/today?on=${next}`} aria-label="Next day">
        ›
      </ButtonLink>
      {date !== today ? (
        <ButtonLink href="/today" variant="chip">
          Back to today
        </ButtonLink>
      ) : null}
      <span className="sr-only">{formatCalendarDate(date)}</span>
    </div>
  );
}

export function CoachNote({ week, note }: { week: number; note: string }) {
  const key = `ct-note-seen:${week}`;
  const seen = useStoredFlag(key);
  useEffect(() => {
    if (localStorage.getItem(key) !== "1") localStorage.setItem(key, "1");
  }, [key]);
  if (seen) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          localStorage.removeItem(key);
          window.dispatchEvent(new StorageEvent("storage", { key }));
        }}
      >
        Show the note for this week
      </Button>
    );
  }
  return <p className="muted">{note}</p>;
}

export function LevelUpCard({
  date,
  patternId,
  patternName,
  exerciseName,
  suggestedName,
  suggestedId,
  reason,
}: {
  date: string;
  patternId: string;
  patternName: string;
  exerciseName: string;
  suggestedName: string;
  suggestedId: string;
  reason: string;
}) {
  const key = `ct-stay:${date}:${patternId}`;
  const stored = useStoredFlag(key);
  if (stored) return null;
  return (
    <section className="card" aria-labelledby={`ready-${patternId}`}>
      <h2 id={`ready-${patternId}`}>Ready to level up</h2>
      <p>
        {patternName} can move up to {suggestedName}. {reason}
      </p>
      <p className="muted">You were on {exerciseName}.</p>
      <div className="row">
        <form action={acceptLevel}>
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="patternId" value={patternId} />
          <input type="hidden" name="toExerciseId" value={suggestedId} />
          <input type="hidden" name="next" value={`/today?on=${date}`} />
          <SubmitButton>Move up to {suggestedName}</SubmitButton>
        </form>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            localStorage.setItem(key, "1");
            window.dispatchEvent(new StorageEvent("storage", { key }));
          }}
        >
          Stay for now
        </Button>
      </div>
    </section>
  );
}
