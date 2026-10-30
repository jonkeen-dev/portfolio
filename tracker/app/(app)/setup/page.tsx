import { SetupFlow } from "@/components/setup-flow";
import { nextMondayOnOrAfter } from "@/lib/engine/dates";
import { todayIso } from "@/lib/today";

export const metadata = { title: "Setup" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const start = nextMondayOnOrAfter(todayIso("UTC"));
  return (
    <>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      <SetupFlow defaultStart={start} />
    </>
  );
}
