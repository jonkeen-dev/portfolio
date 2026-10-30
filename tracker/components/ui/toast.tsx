export function Toast({ message, tone = "done" }: { message: string; tone?: "done" | "danger" }) {
  if (!message) return null;
  return (
    <p className={tone === "danger" ? "toast toast-danger" : "toast"} role="status">
      {message}
    </p>
  );
}
