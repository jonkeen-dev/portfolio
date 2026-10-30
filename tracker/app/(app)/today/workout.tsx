"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { flushQueue, postSet, clientIdFor } from "@/components/sync-set";
import { useSessionTimer } from "@/components/session-timer";
import { Button } from "@/components/ui/button";
import { Keep } from "@/components/ui/keep";
import { ChipGroup } from "@/components/ui/chip";
import { CheckIcon } from "@/components/ui/icons";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { Toast } from "@/components/ui/toast";
import { ExerciseDetail } from "@/components/exercise-detail";
import { completeSession } from "@/lib/actions";
import { savedSetLine, setGuidance } from "@/lib/plan";
import { seedSetValue } from "@/lib/stepper";
import { restSecondsFor, vibrate } from "@/lib/workout-prefs";
import type { TodayItem } from "@/lib/today";

const RIR_HELP =
  "RIR means reps left in the tank. After the last set, say how many good reps you still had. 3 means the set was solid and you could have done about three more.";

export function WorkoutView({
  date,
  day,
  sessionType,
  items,
  completed,
}: {
  date: string;
  day: string | null;
  sessionType: "workout" | "assessment" | "retest" | "rest";
  items: TodayItem[];
  completed: boolean;
}) {
  const router = useRouter();
  const timer = useSessionTimer();
  const opener = useRef<HTMLElement | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [item, setItem] = useState<TodayItem | null>(null);
  const [setNumber, setSetNumber] = useState(1);
  const [value, setValue] = useState(0);
  const [rir, setRir] = useState("3");
  const [help, setHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"done" | "danger">("done");
  const [howTo, setHowTo] = useState<TodayItem | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [energy, setEnergy] = useState("");
  const [pendingSync, setPendingSync] = useState<Record<string, number>>({});
  const [queued, setQueued] = useState<Record<string, boolean>>({});
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [holdPhase, setHoldPhase] = useState<"idle" | "count" | "run" | "done">("idle");
  const [count, setCount] = useState(3);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const holdStart = useRef(0);
  const holdMarks = useRef({ min: false, max: false });

  useEffect(() => {
    const live = !completed && items.length > 0;
    timer.setSessionLive(live);
    return () => timer.setSessionLive(false);
  }, [completed, items.length, timer]);

  useEffect(() => {
    if (!status) return;
    const timerId = window.setTimeout(() => setStatus(""), 4000);
    return () => window.clearTimeout(timerId);
  }, [status]);

  useEffect(() => {
    const onOnline = () => {
      flushQueue()
        .then(() => router.refresh())
        .catch(() => undefined);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [router]);

  useEffect(() => {
    if (holdPhase !== "count") return;
    const timerId = window.setTimeout(() => {
      if (count <= 1) {
        holdStart.current = Date.now();
        holdMarks.current = { min: false, max: false };
        setHoldPhase("run");
        timer.setHolding(true);
        setCount(0);
        return;
      }
      setCount(count - 1);
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [holdPhase, count, timer]);

  useEffect(() => {
    if (holdPhase !== "run" || !item) return;
    const timerId = window.setInterval(() => {
      const seconds = Math.min(600, Math.round((Date.now() - holdStart.current) / 1000));
      setHoldSeconds(seconds);
      setValue(seconds);
      if (!holdMarks.current.min && seconds >= item.targetMin) {
        holdMarks.current.min = true;
        vibrate(30, timer.prefs.vibrate);
        setStatus("Hold in range.");
      }
      if (!holdMarks.current.max && seconds >= item.targetMax) {
        holdMarks.current.max = true;
        vibrate([80, 60, 80], timer.prefs.vibrate);
        setStatus("Top of the range. Stop when you're ready.");
      }
    }, 200);
    return () => window.clearInterval(timerId);
  }, [holdPhase, item, timer.prefs.vibrate]);

  const someLogged = items.some((entry) => entry.logged.some((logged, index) => typeof logged === "number" || typeof pendingSync[`${entry.exerciseId}:${index + 1}`] === "number"));

  useEffect(() => {
    document.documentElement.style.setProperty("--finish-dock", someLogged && !completed ? "4.5rem" : "0px");
    return () => document.documentElement.style.setProperty("--finish-dock", "0px");
  }, [someLogged, completed]);

  function shown(entry: TodayItem, index: number): number | null {
    const server = entry.logged[index];
    if (typeof server === "number") return server;
    const pending = pendingSync[`${entry.exerciseId}:${index + 1}`];
    return typeof pending === "number" ? pending : null;
  }

  function openSet(next: TodayItem, number: number) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const existing = shown(next, number - 1);
    const prior = next.previous[number - 1] ?? next.previous[next.previous.length - 1];
    setItem(next);
    setSetNumber(number);
    setValue(seedSetValue(existing, prior, next.targetMin));
    setRir(next.rir === null ? String(next.aimRir) : String(next.rir));
    setHelp(false);
    setSide(next.unit.includes("per_side") ? "left" : null);
    setHoldPhase("idle");
    setHoldSeconds(0);
    timer.setHolding(false);
  }

  function beginHold() {
    const reduced = timer.prefs.reduceMotion || document.documentElement.dataset.reduceMotion === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (timer.prefs.holdLeadIn && !reduced) {
      setCount(3);
      setHoldPhase("count");
      return;
    }
    holdStart.current = Date.now();
    holdMarks.current = { min: false, max: false };
    setHoldPhase("run");
    timer.setHolding(true);
  }

  function stopHold() {
    const seconds = Math.min(600, Math.round((Date.now() - holdStart.current) / 1000));
    setHoldSeconds(seconds);
    setValue(seconds);
    setHoldPhase("done");
    timer.setHolding(false);
  }

  async function save() {
    if (!item || saving) return;
    if (side === "left") {
      setSide("right");
      setHoldPhase("idle");
      setHoldSeconds(0);
      setStatus("Now the right side.");
      return;
    }
    setSaving(true);
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
    const key = `${item.exerciseId}:${setNumber}`;
    const loggedValues = item.logged.map((logged, index) => (index + 1 === setNumber ? value : shown(item, index) ?? logged));
    const exerciseDone = loggedValues.every((logged) => typeof logged === "number");
    const atTop = exerciseDone && loggedValues.every((logged) => typeof logged === "number" && logged >= item.targetMax);
    const nextIndex = items.findIndex((entry) => entry.key === item.key);
    const later = items.slice(nextIndex + 1).find((entry) => entry.logged.some((logged) => logged === null));
    const moreHere = setNumber < item.prescribedSets;
    setSaving(false);
    setItem(null);
    timer.setHolding(false);
    if (!result.ok) {
      setTone("danger");
      setStatus(result.error);
      return;
    }
    setPendingSync((current) => ({ ...current, [key]: value }));
    if (result.queued) setQueued((current) => ({ ...current, [key]: true }));
    vibrate(30, timer.prefs.vibrate);
    const line = savedSetLine({
      setNumber,
      value,
      unit: item.unit,
      queued: Boolean(result.queued),
      exerciseDone,
      exerciseName: item.name,
      loggedValues: loggedValues.filter((logged): logged is number => typeof logged === "number"),
      sessionsToward: atTop ? Math.min(2, item.sessionsAtTop + 1) : null,
      nextName: item.nextName,
    });
    setTone("done");
    setStatus(line);
    const seconds = restSecondsFor(timer.prefs.restTimer, { short: item.restSeconds, long: item.restLong });
    if (seconds > 0 && (moreHere || later)) {
      const eyebrow = moreHere ? `Rest, then set ${setNumber + 1}` : `Rest, then ${later?.name ?? "the next exercise"}`;
      timer.startRest(eyebrow, seconds);
    }
    router.refresh();
  }

  const seconds = item?.unit.startsWith("seconds") ?? false;
  const lastSet = Boolean(item && setNumber === item.prescribedSets);
  const earlier = item ? shown(item, setNumber - 2) : null;
  const guidance = item
    ? setGuidance({
        targetMin: item.targetMin,
        targetMax: item.targetMax,
        setNumber,
        previousSameSet: item.previous[setNumber - 1] ?? null,
        earlierThisSession: typeof earlier === "number" ? earlier : null,
        value,
      })
    : "";

  return (
    <>
      <Toast message={status} tone={tone} />
      <div className="stack">
        {items.map((entry) => {
          const values = entry.logged.map((_, index) => shown(entry, index));
          const done = values.every((logged) => typeof logged === "number");
          const current = !done && items.find((row) => row.logged.some((_, index) => shown(row, index) === null))?.key === entry.key;
          const nextNumber = values.findIndex((logged) => logged === null) + 1;
          const loggedText = values.filter((logged): logged is number => typeof logged === "number");
          const unit = entry.unit.startsWith("seconds") ? " s" : "";
          const open = openKey === entry.key || (openKey === null && current);
          return (
            <section key={entry.key} className={`card exercise-row${done ? " is-done" : ""}${current ? " is-current" : ""}`}>
              <button type="button" className="row-toggle" aria-expanded={open} onClick={() => setOpenKey(open ? "" : entry.key)}>
                <MiniLadder level={entry.level} total={entry.rungTotal} />
                <span>
                  <span className="row-title">
                    <Keep text={entry.name} />
                    {done ? <span className="sr-only">, done</span> : null}
                  </span>
                  <span className="meta">
                    <Keep
                      text={`${entry.patternName} · level ${entry.level} of ${entry.rungTotal} · ${entry.prescribedSets} × ${entry.targetMin}–${entry.targetMax}${unit}${loggedText.length > 0 ? ` · ${loggedText.join(", ")}` : ""}`}
                    />
                  </span>
                </span>
                {done ? (
                  <span className="done-badge" aria-hidden="true">
                    <CheckIcon />
                  </span>
                ) : null}
                {current ? <span className="tag tag-now">Now</span> : null}
              </button>
              {open ? (
                <div className="chip-row">
                  {values.map((logged, index) => {
                    const number = index + 1;
                    const unsynced = queued[`${entry.exerciseId}:${number}`] && typeof entry.logged[index] !== "number";
                    return (
                      <Button
                        key={number}
                        variant="chip"
                        type="button"
                        aria-label={
                          typeof logged === "number"
                            ? `${entry.name}, set ${number}, ${logged} ${entry.unit.startsWith("seconds") ? "seconds" : "reps"}, saved`
                            : `${entry.name}, set ${number}`
                        }
                        onClick={() => openSet(entry, number)}
                      >
                        {typeof logged === "number" ? `Set ${number} · ${logged}` : `Set ${number}`}
                        {unsynced ? <span className="sync-dot" title="Not synced"><span className="sr-only">Not synced</span></span> : null}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
              <div className="action-row">
                {current && nextNumber > 0 ? (
                  <Button variant="primary" type="button" onClick={() => openSet(entry, nextNumber)}>
                    Log set {nextNumber}
                  </Button>
                ) : null}
                <Button variant="secondary" type="button" onClick={() => setHowTo(entry)}>
                  How to
                </Button>
              </div>
            </section>
          );
        })}
      </div>

      {someLogged && !completed ? (
        <div className="finish-dock">
          <Button variant="primary" type="button" onClick={() => setFinishOpen(true)}>
            Finish session
          </Button>
        </div>
      ) : null}

      {item ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) {
              setItem(null);
              timer.setHolding(false);
            }
          }}
          title={item.name}
          description={guidance}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <div className="stack">
            <div className="exercise-head">
              <MiniLadder level={item.level} total={item.rungTotal} />
              <p className="eyebrow">
                Set {setNumber} of {item.prescribedSets}
                {lastSet ? " · last set" : ""} · {item.patternName} level {item.level}
                {side ? ` · ${side === "left" ? "Left side" : "Right side"}` : ""}
              </p>
            </div>
            {side === "right" && holdPhase === "idle" ? <p>Now the right side.</p> : null}
            {seconds && holdPhase === "idle" ? (
              <Button variant="primary" type="button" onClick={beginHold}>
                Start
              </Button>
            ) : null}
            {holdPhase === "count" ? <p className="num-hold">{count}</p> : null}
            {holdPhase === "run" ? (
              <div className="stack">
                <p className="num-hold">{holdSeconds}</p>
                <div className="hold-track" aria-hidden="true">
                  <div
                    className={holdSeconds >= item.targetMin ? "hold-fill is-done" : "hold-fill"}
                    style={{ width: `${Math.min(100, (holdSeconds / Math.max(1, item.targetMax)) * 100)}%` }}
                  />
                </div>
                <p className="meta">{holdSeconds >= item.targetMin ? "In range." : `Aim for ${item.targetMin}–${item.targetMax} seconds.`}</p>
                <Button variant="primary" className="hold-stop" type="button" onClick={stopHold}>
                  Stop
                </Button>
              </div>
            ) : null}
            {holdPhase !== "run" && holdPhase !== "count" ? (
              <Stepper
                id="set-value"
                value={value}
                onChange={setValue}
                unit={seconds ? "seconds" : "reps"}
                label={seconds ? "Seconds" : "Reps"}
              />
            ) : null}
            {lastSet && holdPhase !== "run" && holdPhase !== "count" ? (
              <div className="stack">
                <div className="chip-label-row">
                  <span id="rir-label">Reps left in the tank</span>
                  <Button variant="ghost" type="button" aria-expanded={help} aria-controls="rir-help" onClick={() => setHelp((open) => !open)}>
                    <span aria-hidden="true">?</span>
                    <span className="sr-only">What does RIR mean?</span>
                  </Button>
                </div>
                <p id="rir-help" hidden={!help}>{RIR_HELP}</p>
                <ChipGroup
                  label="Reps left in the tank"
                  labelId="rir-label"
                  value={rir}
                  onChange={setRir}
                  options={["0", "1", "2", "3", "4", "5"].map((option) => ({ value: option, label: option === "5" ? "5+" : option }))}
                />
                <p className="meta">Today&apos;s aim: about {item.aimRir}.</p>
              </div>
            ) : null}
            {holdPhase !== "run" && holdPhase !== "count" ? (
              <Button variant="primary" type="button" pending={saving} pendingLabel="Saving…" onClick={save}>
                {side === "left" ? "Save left side" : "Save set"}
              </Button>
            ) : null}
          </div>
        </Sheet>
      ) : null}

      {howTo ? (
        <Sheet open onOpenChange={(open) => { if (!open) setHowTo(null); }} title={howTo.name} description="A short demo and the first cues.">
          <ExerciseDetail
            mode="howto"
            names={{}}
            item={{
              id: howTo.exerciseId,
              description: howTo.description,
              cues: howTo.cues,
              mistakes: howTo.mistakes,
              safetyNote: howTo.safetyNote,
              regressionId: howTo.regressionId,
              progressionId: howTo.progressionId,
              video: howTo.video,
            }}
          />
        </Sheet>
      ) : null}

      {finishOpen ? (
        <Sheet open onOpenChange={setFinishOpen} title="How did that feel?" description="Optional. Skip it if you would rather just save.">
          <div className="stack">
            <ChipGroup
              label="Energy"
              value={energy}
              onChange={setEnergy}
              options={[
                { value: "1", label: "1 Flat" },
                { value: "2", label: "2" },
                { value: "3", label: "3 Okay" },
                { value: "4", label: "4" },
                { value: "5", label: "5 Strong" },
                { value: "", label: "Skip" },
              ]}
            />
            <form className="stack" action={completeSession}>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="sessionType" value={sessionType} />
              <input type="hidden" name="energy" value={energy} />
              <Button variant="primary" type="submit">
                Save and finish
              </Button>
            </form>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
