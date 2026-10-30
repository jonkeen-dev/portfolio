"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { RestBar } from "@/components/ui/rest-bar";
import { extendRest, remainingSeconds, restShouldHide, startRest, withRestEnd, type RestSnapshot } from "@/lib/timer";
import { vibrate, type WorkoutPrefs } from "@/lib/workout-prefs";

const STORAGE_KEY = "ct-rest-v1";

type TimerContext = {
  prefs: WorkoutPrefs;
  startRest: (eyebrow: string, seconds: number) => void;
  setSessionLive: (live: boolean) => void;
  setHolding: (holding: boolean) => void;
  announce: (message: string) => void;
};

const TimerContext = createContext<TimerContext | null>(null);

export function useSessionTimer(): TimerContext {
  const value = useContext(TimerContext);
  if (!value) {
    return {
      prefs: { reduceMotion: false, restTimer: "shortest", holdLeadIn: true, vibrate: true, keepScreenOn: true },
      startRest: () => undefined,
      setSessionLive: () => undefined,
      setHolding: () => undefined,
      announce: () => undefined,
    };
  }
  return value;
}

function readStored(): RestSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RestSnapshot;
    if (!parsed || typeof parsed.endsAt !== "number") return null;
    return withRestEnd(parsed, Date.now());
  } catch {
    return null;
  }
}

function endedCopy(eyebrow: string): string {
  const next = eyebrow.replace(/^Rest, then /, "");
  return `Rest's up. ${next} when you're ready.`;
}

export function SessionTimerProvider({
  children,
  prefs,
}: {
  children: React.ReactNode;
  prefs: WorkoutPrefs;
}) {
  const [rest, setRest] = useState<RestSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionLive, setSessionLive] = useState(false);
  const [holding, setHolding] = useState(false);
  const announced = useRef({ ten: false, end: false });

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const stored = readStored();
      if (stored && !restShouldHide(stored, Date.now())) setRest(stored);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!rest) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [rest, ready]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!rest) return;
    const timer = window.setInterval(() => {
      const clock = Date.now();
      setNow(clock);
      setRest((current) => {
        if (!current) return current;
        const next = withRestEnd(current, clock);
        if (restShouldHide(next, clock)) return null;
        if (next.ended === current.ended && next.endedAt === current.endedAt) return current;
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [rest]);

  const left = rest ? remainingSeconds(rest.endsAt, now) : 0;

  useEffect(() => {
    if (!rest) {
      announced.current = { ten: false, end: false };
      return;
    }
    if (!rest.ended && left === 10 && !announced.current.ten) {
      announced.current.ten = true;
      setMessage("10 seconds left.");
    }
    if (rest.ended && !announced.current.end) {
      announced.current.end = true;
      setMessage("Rest's up.");
      vibrate([80, 60, 80], prefs.vibrate);
    }
  }, [rest, left, prefs.vibrate]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    document.documentElement.style.setProperty("--rest-dock", rest ? "11rem" : "0px");
    return () => document.documentElement.style.setProperty("--rest-dock", "0px");
  }, [rest]);

  useEffect(() => {
    if (!prefs.keepScreenOn || (!sessionLive && !holding && !rest)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () => {
      if (!("wakeLock" in navigator) || cancelled) return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          lock = sentinel;
        })
        .catch(() => undefined);
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => undefined);
    };
  }, [prefs.keepScreenOn, sessionLive, holding, rest]);

  const api = useMemo<TimerContext>(
    () => ({
      prefs,
      setSessionLive,
      setHolding,
      announce: setMessage,
      startRest: (eyebrow, seconds) => {
        if (seconds <= 0) return;
        const next = startRest(eyebrow, seconds, Date.now());
        announced.current = { ten: false, end: false };
        setRest(next);
        setMessage(`Rest started, ${seconds} seconds.`);
      },
    }),
    [prefs],
  );

  function dismiss() {
    setRest(null);
  }

  return (
    <TimerContext.Provider value={api}>
      {children}
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
      {rest ? (
        <div
          className="rest-dock"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            if (rest.ended) dismiss();
          }}
        >
          <RestBar
            eyebrow={rest.eyebrow}
            secondsLeft={rest.ended ? 0 : left}
            totalSeconds={rest.totalSeconds}
            ended={rest.ended}
            endedLabel={endedCopy(rest.eyebrow)}
            onAdd={() => setRest((current) => (current ? extendRest(current, 15, Date.now()) : current))}
            onSkip={dismiss}
          />
        </div>
      ) : null}
    </TimerContext.Provider>
  );
}
