import type { Metadata } from "next";

import RoadmapClient from "./roadmap-client";

export const metadata: Metadata = {
  title: "Roadmap — jonkeen.dev",
  description: "Feature tracking by status and project.",
};

export default function RoadmapPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-32 pb-16">
      <h1 className="page-h1">Roadmap</h1>
      <p className="prose-body mt-4 max-w-2xl">Feature tracking by status and project.</p>
      <RoadmapClient />
    </section>
  );
}
