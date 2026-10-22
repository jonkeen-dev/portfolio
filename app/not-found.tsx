import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-6 pt-32 pb-16">
      <p className="text-accent-bright font-mono text-sm">404</p>
      <h1 className="page-h1 mt-3">Nothing here yet.</h1>
      <p className="prose-body mt-4 max-w-md">
        This page may not be built yet, or the link might be off. Either way, here&apos;s a way
        back.
      </p>
      <Link
        href="/"
        className="back-link border-accent-bright/30 text-accent-bright hover:bg-accent-bright/10 mt-8 inline-block rounded-md border px-4 py-2 transition-colors"
      >
        Back home
      </Link>
    </section>
  );
}
