import { headers } from "next/headers";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-pathname") ?? "";
  const nested = path.startsWith("/settings/");
  return (
    <>
      {nested ? (
        <p>
          <a href="/settings">Back to Settings</a>
        </p>
      ) : null}
      {children}
    </>
  );
}
