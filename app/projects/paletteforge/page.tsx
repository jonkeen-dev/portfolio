import type { Metadata } from "next";

import { projects } from "@/lib/projects";
import CaseStudy from "@/components/sections/case-study";

const project = projects.find((p) => p.slug === "paletteforge")!;

export const metadata: Metadata = {
  title: `${project.title} — jonkeen.dev`,
  description: project.summary,
};

export default function PaletteForge() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <CaseStudy project={project} />
    </section>
  );
}
