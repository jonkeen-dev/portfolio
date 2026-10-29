"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clientIdFor, postSet } from "@/components/sync-set";
import type { TodayItem } from "@/lib/today";

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
  const [item, setItem] = useState<TodayItem | null>(null);
  const [setNumber, setSetNumber] = useState(1);
  const [value, setValue] = useState(0);
  const [rir, setRir] = useState("3");
  const [status, setStatus] = useState("");
  const [restToken, setRestToken] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);

  useEffect(() => {
    if (!restToken || restSeconds <= 0) return;
    const started = Date.now();
    const total = restSeconds;
    const timer = window.setInterval(() => {
      const left = Math.max(0, total - Math.round((Date.now() - started) / 1000));
      if (left === 10) setStatus("10 seconds left.");
      if (left === 0) {
        setStatus("Rest finished.");
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restToken, restSeconds]);

  function openSet(next: TodayItem, number: number) {
    const existing = next.logged[number - 1];
    const prior = next.previous[number - 1] ?? next.previous[next.previous.length - 1];
    const seed = typeof existing === "number" ? existing : typeof prior === "number" ? prior : next.targetMin;
    setItem(next);
    setSetNumber(number);
    setValue(seed);
    setRir(next.rir === null ? "3" : String(next.rir));
  }

  async function save() {
    if (!item) return;
    const last = setNumber === item.prescribedSets;
    const result = await postSet({
      date,
      exerciseId: item.exerciseId,
      block: item.block,
      order: item.order,
      setNumber,
      value,
      rir: last ? Number(rir) : null,
      prescribedSets: item.prescribedSets,
      targetMin: item.targetMin,
      targetMax: item.targetMax,
      day,
      sessionType: sessionType === "rest" ? "workout" : sessionType,
      clientId: clientIdFor(date),
    });
    const savedName = item.name;
    const savedNumber = setNumber;
    const restFor = item.restSeconds;
    const more = setNumber < item.prescribedSets;
    setItem(null);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    const savedText = result.queued
      ? "Saved on this device. It will sync when you are back online."
      : `${savedName} set ${savedNumber} saved.`;
    setStatus(more ? `${savedText} Rest started, ${restFor} seconds.` : savedText);
    if (more) {
      setRestSeconds(restFor);
      setRestToken((current) => current + 1);
    }
    router.refresh();
  }

  const unitLabel = item?.unit.startsWith("seconds") ? "Seconds" : "Reps or seconds";

  return (
    <div className="stack">
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {items.map((entry) => (
        <section key={entry.key} className="card" aria-labelledby={`ex-${entry.key}`}>
          <h2 id={`ex-${entry.key}`}>
            {entry.block} · {entry.name}
          </h2>
          <p className="muted">
            {entry.prescribedSets} sets of {entry.targetMin}–{entry.targetMax}
            {entry.unit.startsWith("seconds") ? " seconds" : " reps"}
          </p>
          {entry.cues[0] ? <p>{entry.cues[0]}</p> : null}
          <div className="stack">
            {entry.logged.map((logged, index) => {
              const number = index + 1;
              const suffix = typeof logged === "number" ? `, ${logged}` : "";
              return (
                <button key={number} className="tap" type="button" onClick={() => openSet(entry, number)}>
                  {entry.name} set {number}
                  {suffix}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <Dialog.Root open={item !== null} onOpenChange={(open) => { if (!open) setItem(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog">
            <Dialog.Title>
              {item?.name}, set {setNumber}
            </Dialog.Title>
            <Dialog.Description>
              Aim for {item?.targetMin} to {item?.targetMax}. Leave about {item?.rir ?? 3} reps in the tank on the last set.
            </Dialog.Description>
            <div className="stack">
              <label htmlFor="set-value">
                {unitLabel}
                <input
                  id="set-value"
                  type="number"
                  inputMode="numeric"
                  role="spinbutton"
                  min={0}
                  max={600}
                  aria-valuemin={0}
                  aria-valuemax={600}
                  aria-valuenow={value}
                  value={value}
                  onChange={(event) => setValue(Number(event.target.value))}
                />
              </label>
              <div className="row">
                <button className="tap" type="button" onClick={() => setValue((current) => Math.max(0, current - 1))}>
                  Decrease
                </button>
                <button className="tap" type="button" onClick={() => setValue((current) => Math.min(600, current + 1))}>
                  Increase
                </button>
              </div>
              {item && setNumber === item.prescribedSets ? (
                <label htmlFor="rir">
                  Reps left in the tank
                  <select id="rir" value={rir} onChange={(event) => setRir(event.target.value)}>
                    {["0", "1", "2", "3", "4", "5"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button className="tap primary" type="button" onClick={save}>
                Save set
              </button>
              <Dialog.Close className="tap" type="button">
                Cancel
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
