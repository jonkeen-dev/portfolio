import type { Metadata } from "next";
import Link from "next/link";

import { projects } from "@/lib/projects";

const project = projects.find((p) => p.slug === "palletforge")!;

export const metadata: Metadata = {
  title: "PalletForge — jonkeen.dev",
  description: project.summary,
};

const sections = [
  { heading: "Problem", content: project.problem },
  { heading: "Constraints", content: project.constraints },
  { heading: "Decisions", content: project.decisions },
  { heading: "Results", content: project.results },
  { heading: "What I learned", content: project.learned },
];

export default function PalletForgePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <Link
        href="/projects"
        className="text-foreground-muted hover:text-foreground-secondary text-sm transition-colors"
      >
        ← All projects
      </Link>

      <h1 className="text-foreground mt-6 text-4xl font-medium tracking-tight">{project.title}</h1>
      <p className="text-foreground-secondary mt-4 text-base">{project.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="border-border/15 text-foreground-muted rounded-full border px-3 py-1 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      {sections.map(({ heading, content }) => (
        <div key={heading}>
          <h2 className="text-foreground mt-12 text-xl font-medium">{heading}</h2>
          <p className="text-foreground-secondary mt-3 text-base leading-relaxed">{content}</p>
        </div>
      ))}

      {project.links.length > 0 && (
        <div className="mt-12 flex gap-4">
          {project.links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 rounded-md border px-4 py-2 text-sm transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
