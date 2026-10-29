export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main id="main" tabIndex={-1} className="page">
      <h1>Privacy</h1>
      <p>This log is private unless you share it. Search engines are asked to skip it unless you turn indexing on.</p>
      <ul>
        <li>Sign-in uses a passkey or a one-time email link. There is no password.</li>
        <li>Session cookies stay on this site. The address bar host is the only one that can read them.</li>
        <li>Stored network data is a hash of the IP and a browser family, not the full user agent.</li>
        <li>Demo videos load from YouTube only after you press play.</li>
        <li>You can download your sets or delete the account from Settings.</li>
      </ul>
      <p>
        <a href="/sign-in">Sign in</a>
      </p>
    </main>
  );
}
