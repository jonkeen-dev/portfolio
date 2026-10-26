import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="page">
      <h1>Page not found</h1>
      <p>
        <Link href="/">Go to the tracker</Link>
      </p>
    </main>
  );
}
