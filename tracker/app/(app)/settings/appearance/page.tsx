import { ThemeChooser } from "@/components/account-tools";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveAppearance } from "@/lib/actions";
import { currentProfile, currentSession } from "@/lib/session";

export const metadata = { title: "Look and accessibility" };

export default async function AppearancePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await currentSession();
  if (!session) return null;
  const profile = await currentProfile(session.user.id);
  if (!profile) return null;
  const { saved } = await searchParams;
  const prefs = (profile.prefs ?? {}) as { reduceMotion?: boolean };
  return (
    <>
      <PageHeader title="Look and accessibility" description="Match this device is the default." />
      {saved ? (
        <p className="toast" role="status">
          {saved}
        </p>
      ) : null}
      <ThemeChooser />
      <form className="stack" action={saveAppearance}>
        <label className="choice">
          <input type="checkbox" name="reduceMotion" defaultChecked={Boolean(prefs.reduceMotion)} /> Reduce motion
        </label>
        <SubmitButton variant="secondary">Save appearance</SubmitButton>
      </form>
    </>
  );
}
