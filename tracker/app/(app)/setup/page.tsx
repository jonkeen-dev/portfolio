import { saveSetup } from "@/lib/actions";
import { TimezoneField } from "@/components/timezone-field";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { nextMondayOnOrAfter } from "@/lib/engine/dates";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Setup" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const start = nextMondayOnOrAfter(todayIso("UTC"));
  return (
    <>
      <PageHeader
        title="Setup"
        description="When do you want to start? Monday works best. You can change units later."
      />
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <form className="stack" action={saveSetup}>
        <label htmlFor="displayName">
          Name (optional, private)
          <input id="displayName" name="displayName" autoComplete="name" maxLength={80} />
        </label>
        <label htmlFor="startDate">
          Start date
          <input id="startDate" name="startDate" type="date" required defaultValue={start} />
        </label>
        <fieldset>
          <legend>Units</legend>
          <label className="choice">
            <input type="radio" name="units" value="lb" defaultChecked /> Pounds (lb)
          </label>
          <label className="choice">
            <input type="radio" name="units" value="kg" /> Kilograms (kg)
          </label>
        </fieldset>
        <TimezoneField />
        <label className="choice">
          <input type="checkbox" name="hasBar" /> Do you have a pull-up bar?
        </label>
        <SubmitButton>Save setup</SubmitButton>
      </form>
    </>
  );
}
