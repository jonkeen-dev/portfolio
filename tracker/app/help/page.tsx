import { OptionalShell } from "@/components/optional-shell";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <OptionalShell>
      <PageHeader title="Help" />
      <h2 id="rir">What does RIR mean?</h2>
      <p>
        RIR is reps left in the tank. After the last set, say how many good reps you still had. 3 means the set was
        solid and you could have done about three more. 0 means you had nothing left.
      </p>
      <h2>How moving up works</h2>
      <p>
        After two sessions where every set reaches the top of the range, a harder exercise is suggested. You choose
        when to move up.
      </p>
      <h2>Lighter weeks</h2>
      <p>Weeks 4 and 8 use fewer sets and easier effort, and level-ups wait. Your progress holds while you recover.</p>
      <p>
        <a href="/privacy">Privacy</a>
      </p>
    </OptionalShell>
  );
}
