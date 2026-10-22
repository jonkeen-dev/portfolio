import Link from "next/link";

import { Project } from "@/lib/projects";

type CaseStudyProps = {
  project: Project;
};

const sections = (project: Project) => [
  { heading: "Problem", content: project.problem },
  { heading: "Constraints", content: project.constraints },
  { heading: "Decisions", content: project.decisions },
  { heading: "Results", content: project.results },
  { heading: "What I learned", content: project.learned },
];

export default function CaseStudy({ project }: CaseStudyProps) {
  return (
    <>
      <Link href="/projects" className="back-link">
        ← All projects
      </Link>

      <h1 className="page-h1 mt-6">{project.title}</h1>
      <p className="prose-body mt-4">{project.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      {project.highlights && project.highlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {project.highlights.map((item) => (
            <span key={item} className="tag">
              {item}
            </span>
          ))}
        </div>
      )}

      {sections(project).map(({ heading, content }) => (
        <div key={heading}>
          <h2 className="section-h2 mt-10">{heading}</h2>
          <p className="prose-body mt-2">{content}</p>
        </div>
      ))}

      {project.links.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-4">
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
    </>
  );
}
