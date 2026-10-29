import type { Metadata } from "next";

import { getPublishedProjects } from "@/lib/projects";
import { roadmap } from "@/lib/roadmap";

import RoadmapClient from "./roadmap-client";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "What Jon is building next, by status and project.",
};

export default function RoadmapPage() {
  const projects = getPublishedProjects().map((project) => ({
    slug: project.slug,
    title: project.title,
  }));
  const publishedSlugs = new Set(projects.map((project) => project.slug));
  const items = roadmap
    .filter((item) => publishedSlugs.has(item.project))
    .map((item) => ({
      title: item.title,
      summary: item.summary,
      project: item.project,
      status: item.status,
      dateAdded: item.dateAdded,
    }));

  return (
    <section className="mx-auto max-w-5xl px-6 pt-32 pb-16">
      <h1 className="page-h1">Roadmap</h1>
      <p className="prose-body mt-4 max-w-2xl">
        A public look at what I&apos;m working on. Not the main story — just an honest backlog.
      </p>
      <RoadmapClient projects={projects} items={items} />
    </section>
  );
}
