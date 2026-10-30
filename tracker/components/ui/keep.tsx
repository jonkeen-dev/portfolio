/**
 * Keep each whitespace-separated token on one line so names like
 * "Push-Up" and ranges like "8–12" wrap only at word boundaries.
 */
export function Keep({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) =>
    part === "" ? null : /\s/.test(part) ? (
      <span key={index}>{part}</span>
    ) : (
      <span key={index} className="nowrap">
        {part}
      </span>
    ),
  );
}
