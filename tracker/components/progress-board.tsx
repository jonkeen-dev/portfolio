"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MiniLadder } from "@/components/ui/mini-ladder";
import { formatCalendarDate } from "@/lib/format";

export type ChartPoint = {
  date: string;
  exerciseName: string;
  top: number;
  targetMax: number;
  levelChange: boolean;
};

export type MovementView = {
  patternId: string;
  name: string;
  level: number;
  rungTotal: number;
  exerciseName: string | null;
  unit: string;
  points: ChartPoint[];
};

function unitNoun(unit: string): string {
  return unit.startsWith("seconds") ? "seconds" : "reps";
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const width = 72;
  const height = 28;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * (width - 4) + 2;
      const y = height - 3 - (value / max) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function MovementChart({ movement }: { movement: MovementView }) {
  const [asTable, setAsTable] = useState(false);
  const points = movement.points;
  const noun = unitNoun(movement.unit);
  const range = Math.max(...points.map((point) => point.targetMax), ...points.map((point) => point.top), 1);
  const width = 320;
  const height = 160;
  const pad = 12;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - (point.top / range) * (height - pad * 2);
    return { x, y, point };
  });
  const line = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const rangeY = height - pad - ((points.at(-1)?.targetMax ?? 0) / range) * (height - pad * 2);
  const summary = points
    .map((point) => `${formatCalendarDate(point.date)} ${point.exerciseName} ${point.top} ${noun}`)
    .join(", ");

  return (
    <div className="stack">
      <div className={asTable ? "is-hidden" : undefined}>
        <svg
          className="line-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${movement.name} top set over sessions. ${summary}`}
        >
          {points.at(-1)?.targetMax ? (
            <line
              x1={pad}
              x2={width - pad}
              y1={rangeY}
              y2={rangeY}
              className="chart-range"
              strokeDasharray="5 4"
            />
          ) : null}
          {coords.length > 1 ? <polyline points={line} className="chart-line" fill="none" /> : null}
          {coords.map((coord) => (
            <circle
              key={coord.point.date}
              cx={coord.x}
              cy={coord.y}
              r={coord.point.levelChange ? 6 : 4}
              className={coord.point.levelChange ? "chart-dot chart-dot-change" : "chart-dot"}
            >
              <title>
                {formatCalendarDate(coord.point.date)}: {coord.point.top} {noun}
                {coord.point.levelChange ? `, level change to ${coord.point.exerciseName}` : ""}
              </title>
            </circle>
          ))}
        </svg>
        <p className="meta">Dashed line is the top of the range. A larger dot is a level change.</p>
      </div>
      <Button type="button" variant="secondary" aria-pressed={asTable} onClick={() => setAsTable((value) => !value)}>
        {asTable ? "Show as chart" : "Show as table"}
      </Button>
      <div className={asTable ? undefined : "sr-only"}>
        <table>
          <caption>
            {movement.name} top set by session
          </caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Exercise</th>
              <th scope="col">Top set</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={`${point.date}-${point.exerciseName}`}>
                <td>{formatCalendarDate(point.date)}</td>
                <td>
                  {point.exerciseName}
                  {point.levelChange ? " (level change)" : ""}
                </td>
                <td>
                  {point.top} {noun}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MovementList({ movements }: { movements: MovementView[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="stack">
      {movements.map((movement) => {
        const open = openId === movement.patternId;
        return (
          <section key={movement.patternId} className="card">
            <button
              type="button"
              className="row-toggle"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : movement.patternId)}
            >
              <MiniLadder level={movement.level} total={movement.rungTotal} />
              <span>
                <span className="row-title">{movement.name}</span>
                <span className="meta">
                  {movement.exerciseName
                    ? `${movement.exerciseName} · level ${movement.level}`
                    : "No level yet"}
                </span>
              </span>
              <Sparkline values={movement.points.map((point) => point.top)} />
            </button>
            {open ? (
              movement.points.length > 0 ? (
                <MovementChart movement={movement} />
              ) : (
                <p>No sessions for this movement yet.</p>
              )
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
