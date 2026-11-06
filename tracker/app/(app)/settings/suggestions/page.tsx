import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { getDatabase } from "@/lib/db";
import { formatZonedDateTime } from "@/lib/format";
import { completeSuggestion, submitSuggestion } from "@/lib/actions";
import { currentProfile, currentSession, userRole } from "@/lib/session";
import {
  SUGGESTION_ERRORS,
  SUGGESTION_LABELS,
  SUGGESTION_MESSAGE_MAX,
  SUGGESTION_SAVED,
  listSuggestions,
  suggestionAccess,
} from "@/lib/suggestions";

export const metadata = { title: "Suggestions" };

const KNOWN_ERRORS = new Set<string>(Object.values(SUGGESTION_ERRORS));

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const role = userRole(session.user);
  const { error, sent } = await searchParams;
  const notice = error && KNOWN_ERRORS.has(error) ? error : error ? "That suggestion could not be sent." : "";
  const received = suggestionAccess(role).review ? await listSuggestions(getDatabase().db, role) : null;
  return (
    <>
      <PageHeader title="Suggestions" description="Send feedback, an idea, or an improvement." />
      {notice ? (
        <p className="alert" role="alert">
          {notice}
        </p>
      ) : null}
      {sent ? (
        <p className="toast" role="status">
          {SUGGESTION_SAVED}
        </p>
      ) : null}
      <form className="stack" action={submitSuggestion}>
        <fieldset>
          <legend>Type</legend>
          <label className="choice">
            <input type="radio" name="type" value="feedback" required />
            Feedback
          </label>
          <label className="choice">
            <input type="radio" name="type" value="idea" required />
            Idea
          </label>
          <label className="choice">
            <input type="radio" name="type" value="improvement" required />
            Improvement
          </label>
        </fieldset>
        <label htmlFor="suggestion-message">
          Message
          <textarea
            id="suggestion-message"
            name="message"
            className="suggestion-box"
            required
            maxLength={SUGGESTION_MESSAGE_MAX}
            rows={6}
          />
        </label>
        <p className="meta">Up to 2,000 characters.</p>
        <SubmitButton pendingLabel="Sending…">Send suggestion</SubmitButton>
      </form>
      {received ? (
        <>
          <h2>Received</h2>
          {received.length === 0 ? <p>No suggestions yet.</p> : null}
          <ul className="plain-list">
            {received.map((item) => (
              <li key={item.id} className="card stack suggestion-card">
                <p className="row-title">{SUGGESTION_LABELS[item.type as keyof typeof SUGGESTION_LABELS] ?? item.type}</p>
                <p className="suggestion-copy">{item.message}</p>
                <p className="meta">
                  {item.userId === session.user.id ? "You" : "Your partner"} · {formatZonedDateTime(item.createdAt, profile.timezone)}
                </p>
                {item.status === "done" ? (
                  <p className="done-line">Done</p>
                ) : (
                  <form action={completeSuggestion}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton variant="secondary" pendingLabel="Saving…">
                      Mark done
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
