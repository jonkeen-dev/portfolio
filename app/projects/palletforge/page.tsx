import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PalletForge — jonkeen.dev",
  description: "PalletForge case study.",
};

export default function PalletForgePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <Link
        href="/projects"
        className="text-foreground-muted hover:text-foreground-secondary text-sm transition-colors"
      >
        ← All projects
      </Link>
      <h1 className="text-foreground mt-6 text-4xl font-medium tracking-tight">PalletForge</h1>
      <p className="text-foreground-secondary mt-4 text-base">Case study coming soon.</p>
    </section>
  );
}
