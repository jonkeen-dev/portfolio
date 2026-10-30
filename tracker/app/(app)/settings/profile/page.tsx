import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProfile } from "@/lib/actions";
import { currentProfile, currentSession } from "@/lib/session";

export const metadata = { title: "Profile" };

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { error, saved } = await searchParams;
  return (
    <>
      <PageHeader title="Profile" />
      {saved ? (
        <p className="toast" role="status">
          {saved}
        </p>
      ) : null}
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <form className="stack" action={saveProfile}>
        <label htmlFor="displayName">
          Name
          <input id="displayName" name="displayName" autoComplete="name" defaultValue={session.user.name} maxLength={80} />
        </label>
        <label htmlFor="startDate">
          Start date
          <input id="startDate" name="startDate" type="date" required defaultValue={profile.startDate} />
        </label>
        <fieldset>
          <legend>Units</legend>
          <label className="choice">
            <input type="radio" name="units" value="lb" defaultChecked={profile.units !== "kg"} /> Pounds (lb)
          </label>
          <label className="choice">
            <input type="radio" name="units" value="kg" defaultChecked={profile.units === "kg"} /> Kilograms (kg)
          </label>
        </fieldset>
        <fieldset className="choice-stack">
          <legend>Do you have a pull-up bar?</legend>
          <label className="choice-card">
            <input type="radio" name="hasBar" value="yes" defaultChecked={profile.hasBar} />
            <span>Yes</span>
          </label>
          <label className="choice-card">
            <input type="radio" name="hasBar" value="no" defaultChecked={!profile.hasBar} />
            <span>Not yet</span>
          </label>
        </fieldset>
        <SubmitButton variant="secondary">Save profile</SubmitButton>
      </form>
    </>
  );
}
