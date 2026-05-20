import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — jonkeen.dev",
  description: "About Jon Keen.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <h1 className="text-foreground text-4xl font-medium tracking-tight">About</h1>
      <p className="text-foreground-secondary mt-4 text-base">Coming soon.</p>
    </section>
  );
}
