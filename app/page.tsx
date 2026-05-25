import Link from "next/link";

import { projects } from "@/lib/projects";

const featured = projects.slice(0, 2);

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
        <p className="text-accent-bright font-mono text-sm">Software Engineer</p>
        <h1 className="text-foreground mt-4 text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
          Jon Keen
        </h1>
        <p className="text-foreground-secondary mt-6 max-w-xl text-lg leading-relaxed">
          Software engineer with twenty years of retail context and an analyst&apos;s habit of
          asking why first.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/projects"
            className="bg-accent-bright text-background rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
          >
            See projects
          </Link>
          <Link
            href="/about"
            className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors"
          >
            About
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="text-foreground text-xl font-medium">Featured work</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {featured.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/projects/${project.slug}`}
                className="border-border/15 hover:border-border/40 focus-visible:ring-accent/50 block rounded-lg border p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <h3 className="text-foreground text-lg font-medium">{project.title}</h3>
                <p className="text-foreground-secondary mt-2 text-sm">{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border-border/15 text-foreground-muted rounded-full border px-2.5 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
