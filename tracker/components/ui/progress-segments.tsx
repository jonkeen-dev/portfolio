export function ProgressSegments({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  if (total <= 0) return null;
  return (
    <div className="segments-block">
      <div
        className="segments"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={label}
        aria-valuetext={label}
      >
        {Array.from({ length: total }, (_, index) => {
          const state = index < done ? "done" : index === done && done < total ? "current" : "todo";
          return <span key={index} className={`segment segment-${state}`} />;
        })}
      </div>
      <p className="meta">{label}</p>
    </div>
  );
}
