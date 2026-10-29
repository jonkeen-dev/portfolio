import { saveSetup } from "@/lib/actions";
import { nextMondayOnOrAfter } from "@/lib/engine/dates";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Setup" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const start = nextMondayOnOrAfter(todayIso("UTC"));
  return (
    <>
      <h1>Setup</h1>
      <p>Tell the program when you start. Monday is a good first day. You can change units later.</p>
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
        <label htmlFor="timezone">
          Timezone
          <select id="timezone" name="timezone" defaultValue="UTC">
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Chicago">America/Chicago</option>
            <option value="America/Denver">America/Denver</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </label>
        <label className="choice">
          <input type="checkbox" name="hasBar" /> Do you have a pull-up bar?
        </label>
        <button className="tap primary" type="submit">
          Save setup
        </button>
      </form>
    </>
  );
}
