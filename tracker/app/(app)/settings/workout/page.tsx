import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveWorkoutPrefs } from "@/lib/actions";
import { currentProfile, currentSession } from "@/lib/session";
import { readWorkoutPrefs } from "@/lib/workout-prefs";

export const metadata = { title: "Workout" };

export default async function WorkoutSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { saved } = await searchParams;
  const workout = readWorkoutPrefs(profile.prefs);
  return (
    <>
      <PageHeader title="Workout" />
      {saved ? (
        <p className="toast" role="status">
          {saved}
        </p>
      ) : null}
      <form className="stack" action={saveWorkoutPrefs}>
        <fieldset>
          <legend>Rest timer</legend>
          <label className="choice">
            <input type="radio" name="restTimer" value="shortest" defaultChecked={workout.restTimer === "shortest"} /> Shortest
          </label>
          <label className="choice">
            <input type="radio" name="restTimer" value="longest" defaultChecked={workout.restTimer === "longest"} /> Longest
          </label>
          <label className="choice">
            <input type="radio" name="restTimer" value="off" defaultChecked={workout.restTimer === "off"} /> Off
          </label>
        </fieldset>
        <label className="choice">
          <input type="checkbox" name="holdLeadIn" defaultChecked={workout.holdLeadIn} /> Count down 3-2-1 before a hold
        </label>
        <label className="choice">
          <input type="checkbox" name="vibrate" defaultChecked={workout.vibrate} /> Vibrate
        </label>
        <label className="choice">
          <input type="checkbox" name="keepScreenOn" defaultChecked={workout.keepScreenOn} /> Keep screen on during a session
        </label>
        <SubmitButton variant="secondary">Save workout</SubmitButton>
      </form>
    </>
  );
}
