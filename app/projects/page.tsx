import type { Metadata } from "next";

import MotionCardLink from "@/components/motion/motion-card-link";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects — jonkeen.dev",
  description: "Case studies and work by Jon Keen.",
};

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-32 pb-16">
      <h1 className="page-h1">Projects</h1>
      <p className="prose-body mt-4 max-w-2xl">Case studies and selected work.</p>

      {projects.length === 0 ? (
        <p className="text-foreground-muted mt-12 text-sm">No projects yet. Check back soon.</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.slug}>
              <MotionCardLink
                href={`/projects/${project.slug}`}
                className="border-border/30 hover:border-border/50 focus-visible:ring-accent/50 block rounded-lg border p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <h2 className="card-title">{project.title}</h2>
                <p className="text-foreground-secondary mt-2 text-sm">{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </MotionCardLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
