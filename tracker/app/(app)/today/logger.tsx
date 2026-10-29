"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clientIdFor, postSet } from "@/components/sync-set";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { CheckIcon } from "@/components/ui/icons";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { Toast } from "@/components/ui/toast";
import { setButtonName } from "@/lib/copy";
import { seedSetValue } from "@/lib/stepper";
import type { TodayItem } from "@/lib/today";

const RIR_HELP =
  "RIR means reps left in the tank. After the last set, say how many good reps you still had. 3 means the set was solid and you could have done about three more.";

export function Logger({
  date,
  day,
  sessionType,
  items,
}: {
  date: string;
  day: string | null;
  sessionType: "workout" | "assessment" | "retest" | "rest";
  items: TodayItem[];
}) {
  const router = useRouter();
  const opener = useRef<HTMLElement | null>(null);
  const [item, setItem] = useState<TodayItem | null>(null);
  const [setNumber, setSetNumber] = useState(1);
  const [value, setValue] = useState(0);
  const [rir, setRir] = useState("3");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"done" | "danger">("done");
  const [help, setHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restToken, setRestToken] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!restToken || restSeconds <= 0) return;
    const started = Date.now();
    const total = restSeconds;
    const timer = window.setInterval(() => {
      const left = Math.max(0, total - Math.round((Date.now() - started) / 1000));
      if (left === 10) {
        setTone("done");
        setStatus("10 seconds left.");
      }
      if (left === 0) {
        setTone("done");
        setStatus("Rest finished.");
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restToken, restSeconds]);

  function openSet(next: TodayItem, number: number) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const existing = next.logged[number - 1];
    const prior = next.previous[number - 1] ?? next.previous[next.previous.length - 1];
    setItem(next);
    setSetNumber(number);
    setValue(seedSetValue(existing, prior, next.targetMin));
    setRir(next.rir === null ? "3" : String(next.rir));
    setHelp(false);
  }

  async function save() {
    if (!item || saving) return;
    setSaving(true);
    const last = setNumber === item.prescribedSets;
    const savedValue = value;
    const result = await postSet({
      date,
      exerciseId: item.exerciseId,
      block: item.block,
      order: item.order,
      setNumber,
      value: savedValue,
      rir: last ? Number(rir) : null,
      prescribedSets: item.prescribedSets,
      targetMin: item.targetMin,
      targetMax: item.targetMax,
      day,
      sessionType: sessionType === "rest" ? "workout" : sessionType,
      clientId: clientIdFor(date),
    });
    const savedNumber = setNumber;
    const restFor = item.restSeconds;
    const more = setNumber < item.prescribedSets;
    const noun = item.unit.startsWith("seconds") ? "seconds" : "reps";
    setSaving(false);
    setItem(null);
    if (!result.ok) {
      setTone("danger");
      setStatus(result.error);
      return;
    }
    const savedText = result.queued
      ? "Saved on this phone. It'll sync when you're back online."
      : `Set ${savedNumber} saved · ${savedValue} ${noun}.`;
    setTone("done");
    setStatus(more ? `${savedText} Rest started, ${restFor} seconds.` : savedText);
    if (more) {
      setRestSeconds(restFor);
      setRestToken((current) => current + 1);
    }
    router.refresh();
  }

  const currentKey = items.find((entry) => entry.logged.some((logged) => typeof logged !== "number"))?.key;
  const seconds = item?.unit.startsWith("seconds") ?? false;
  const lastSet = Boolean(item && setNumber === item.prescribedSets);
  const aim = item?.rir ?? 3;
  const description = item
    ? lastSet
      ? `Aim for ${item.targetMin} to ${item.targetMax}. Leave about ${aim} reps in the tank on this set.`
      : `Aim for ${item.targetMin} to ${item.targetMax}.`
    : "Log a set.";

  return (
    <div className="stack">
      <Toast message={status} tone={tone} />
      {items.map((entry) => {
        const done = entry.logged.every((logged) => typeof logged === "number");
        const current = entry.key === currentKey && !done;
        const logged = entry.logged.filter((amount): amount is number => typeof amount === "number");
        const unit = entry.unit.startsWith("seconds") ? " s" : "";
        const dose = `${entry.prescribedSets} × ${entry.targetMin}–${entry.targetMax}${unit}`;
        const loggedText = logged.length > 0 ? ` · ${logged.join(", ")}` : "";
        return (
          <section
            key={entry.key}
            className={`card exercise-row${done ? " is-done" : ""}${current ? " is-current" : ""}`}
            aria-labelledby={`ex-${entry.key}`}
          >
            <div className="exercise-head">
              <MiniLadder level={entry.level} total={entry.rungTotal} />
              <div>
                <h2 className="row-title" id={`ex-${entry.key}`}>
                  {entry.name}
                  {done ? <span className="sr-only">, done</span> : null}
                  {current ? <span className="sr-only">, now</span> : null}
                </h2>
                <p className="meta">
                  {entry.patternName} · level {entry.level} of {entry.rungTotal} · {dose}
                  {loggedText}
                </p>
              </div>
              {done ? (
                <span className="done-badge" aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : null}
              {current ? <span className="tag tag-now">Now</span> : null}
            </div>
            <div className="stack">
              {entry.logged.map((amount, index) => {
                const number = index + 1;
                const saved = typeof amount === "number";
                const nextNumber = entry.logged.findIndex((logged) => typeof logged !== "number") + 1;
                return (
                  <Button
                    key={number}
                    variant={current && number === nextNumber ? "primary" : "secondary"}
                    type="button"
                    aria-label={setButtonName(entry.name, number, saved ? amount : null, entry.unit)}
                    onClick={() => openSet(entry, number)}
                  >
                    {saved ? `Set ${number} · ${amount}` : `Set ${number}`}
                  </Button>
                );
              })}
            </div>
          </section>
        );
      })}

      {item ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) setItem(null);
          }}
          title={`${item.name}, set ${setNumber}`}
          description={description}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <div className="stack">
            <Stepper
              id="set-value"
              value={value}
              onChange={setValue}
              unit={seconds ? "seconds" : "reps"}
              label={seconds ? "Seconds" : "Reps"}
            />
            {lastSet ? (
              <div className="stack">
                <div className="chip-label-row">
                  <span id="rir-label">Reps left in the tank</span>
                  <Button
                    variant="ghost"
                    type="button"
                    aria-expanded={help}
                    aria-controls="rir-help"
                    onClick={() => setHelp((open) => !open)}
                  >
                    <span aria-hidden="true">?</span>
                    <span className="sr-only">What does RIR mean?</span>
                  </Button>
                </div>
                {help ? <p id="rir-help">{RIR_HELP}</p> : <p id="rir-help" className="sr-only">{RIR_HELP}</p>}
                <ChipGroup
                  label="Reps left in the tank"
                  labelId="rir-label"
                  value={rir}
                  onChange={setRir}
                  options={["0", "1", "2", "3", "4", "5"].map((option) => ({
                    value: option,
                    label: option === "5" ? "5+" : option,
                  }))}
                />
                <p className="meta">Today&apos;s aim: about {aim}.</p>
              </div>
            ) : null}
            <Button variant="primary" type="button" pending={saving} pendingLabel="Saving…" onClick={save}>
              Save set
            </Button>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
