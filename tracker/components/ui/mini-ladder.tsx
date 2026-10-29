/** Decorative rung ticks. The level is also written out beside this. */
export function MiniLadder({ level, total }: { level: number; total: number }) {
  const count = Math.max(1, total);
  return (
    <span className="mini-ladder" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const rung = index + 1;
        const state = rung < level ? "past" : rung === level ? "current" : "future";
        return <span key={rung} className={`rung rung-${state}`} />;
      })}
    </span>
  );
}
