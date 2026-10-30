"use client";

import { useState } from "react";

import { acceptLevel, setLevelManually } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";

export type LadderRung = {
  id: string;
  name: string;
  level: number;
  equipment: string;
};

export type LadderCard = {
  patternId: string;
  name: string;
  currentId: string | null;
  currentName: string | null;
  currentLevel: number;
  nextId: string | null;
  rungTotal: number;
  statusLine: string;
  tag: string | null;
  readyId: string | null;
  readyName: string | null;
  rungs: LadderRung[];
  asOf: string;
};

function rungState(rung: LadderRung, card: LadderCard): "past" | "current" | "next" | "future" {
  if (card.currentId && rung.id === card.currentId) return "current";
  if (card.nextId && rung.id === card.nextId) return "next";
  if (card.currentLevel > 0 && rung.level < card.currentLevel) return "past";
  return "future";
}

export function LaddersBoard({ cards, initialOpen }: { cards: LadderCard[]; initialOpen: string }) {
  const [openId, setOpenId] = useState(initialOpen);
  const [picking, setPicking] = useState<string | null>(null);
  const [chosen, setChosen] = useState("");
  const sheetCard = cards.find((card) => card.patternId === picking) ?? null;

  function openPicker(card: LadderCard) {
    setChosen(card.currentId ?? card.rungs[0]?.id ?? "");
    setPicking(card.patternId);
  }

  return (
    <div className="stack">
      {cards.map((card) => {
        const open = openId === card.patternId;
        return (
          <section key={card.patternId} className="card" aria-labelledby={`ladder-${card.patternId}`}>
            <button
              type="button"
              className="row-toggle"
              aria-expanded={open}
              onClick={() => setOpenId(open ? "" : card.patternId)}
            >
              <MiniLadder level={card.currentLevel} total={card.rungTotal} />
              <span>
                <span className="row-title" id={`ladder-${card.patternId}`}>
                  {card.name}
                </span>
                <span className="meta">
                  {card.currentName
                    ? `${card.currentName} · level ${card.currentLevel} of ${card.rungTotal}`
                    : "No level chosen yet"}
                </span>
                {card.tag ? <span className={card.tag === "Ready" ? "tag tag-now" : "tag"}>{card.tag}</span> : null}
              </span>
            </button>
            {open ? (
              <div className="stack">
                <p>{card.statusLine}</p>
                <ol className="rung-list">
                  {card.rungs.map((rung) => {
                    const state = rungState(rung, card);
                    return (
                      <li key={rung.id} className={`rung-item rung-item-${state}`}>
                        <span className="rung-mark" aria-hidden="true" />
                        <span className="rung-copy">
                          <span className="row-title">{rung.name}</span>
                          <span className="meta">
                            Level {rung.level}
                            {state === "current" ? " · current" : ""}
                            {state === "next" ? " · next" : ""}
                            {rung.equipment === "bar" ? " · needs a bar" : ""}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="action-row">
                  {card.readyId && card.readyName ? (
                    <form action={acceptLevel}>
                      <input type="hidden" name="date" value={card.asOf} />
                      <input type="hidden" name="patternId" value={card.patternId} />
                      <input type="hidden" name="toExerciseId" value={card.readyId} />
                      <input type="hidden" name="next" value="/ladders" />
                      <SubmitButton>Move up to {card.readyName}</SubmitButton>
                    </form>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={() => openPicker(card)}>
                    Choose a level myself
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
      {sheetCard ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) setPicking(null);
          }}
          title={`Choose a ${sheetCard.name} level`}
          description="Use this if the current level is too easy or too hard."
        >
          <form className="stack" action={setLevelManually}>
            <input type="hidden" name="patternId" value={sheetCard.patternId} />
            <fieldset className="choice-stack">
              <legend className="sr-only">{sheetCard.name} levels</legend>
              {sheetCard.rungs.map((rung) => (
                <label key={rung.id} className={`choice-card${chosen === rung.id ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="exerciseId"
                    value={rung.id}
                    checked={chosen === rung.id}
                    onChange={() => setChosen(rung.id)}
                  />
                  <span>
                    {rung.name}
                    {rung.equipment === "bar" ? " · needs a bar" : ""}
                  </span>
                </label>
              ))}
            </fieldset>
            <SubmitButton pendingLabel="Saving…">Save level</SubmitButton>
          </form>
        </Sheet>
      ) : null}
    </div>
  );
}
