import type { Metadata } from "next";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects — jonkeen.dev",
  description: "Case studies and work by Jon Keen.",
};

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-32 pb-16">
      <h1 className="text-foreground text-4xl font-medium tracking-tight">Projects</h1>
      <p className="text-foreground-secondary mt-4 max-w-2xl text-base">
        Case studies and selected work.
      </p>

      {projects.length === 0 ? (
        <p className="text-foreground-muted mt-12 text-sm">No projects yet. Check back soon.</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <li
              key={project.slug}
              className="border-border/15 hover:border-border/40 rounded-lg border p-6 transition-colors"
            >
              <h2 className="text-foreground text-lg font-medium">{project.title}</h2>
              <p className="text-foreground-secondary mt-2 text-sm">{project.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
