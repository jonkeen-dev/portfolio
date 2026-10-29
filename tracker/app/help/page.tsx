export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <main id="main" tabIndex={-1} className="page">
      <h1>Help</h1>
      <h2 id="rir">What does RIR mean?</h2>
      <p>
        RIR is reps left in the tank. After the last set, say how many good reps you still had. 3 means the set was
        solid and you could have done about three more. 0 means you had nothing left.
      </p>
      <h2>Level-ups</h2>
      <p>
        The app suggests a harder exercise after two sessions where every prescribed set reaches the top of the range.
        Deload weeks hold you where you are. You choose when to accept.
      </p>
      <p>
        <a href="/privacy">Privacy</a>
      </p>
    </main>
  );
}
