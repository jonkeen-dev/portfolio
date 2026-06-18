import MotionButtonLink from "@/components/motion/motion-button-link";
import MotionCardLink from "@/components/motion/motion-card-link";
import { projects } from "@/lib/projects";

const featured = projects.slice(0, 2);

export default function Home() {
  return (
    <>
      <section className="relative mx-auto max-w-3xl px-6 pt-32 pb-16">
        <p className="text-accent-bright font-mono text-sm">Software Engineer</p>
        <div className="hero-text relative">
          {/* Single clean soft glow behind Jon Keen + sub-text. No box, no border, one glow layer only. */}
          <div aria-hidden="true" className="hero-glow" />
          <h1 className="page-h1-hero">Jon Keen</h1>
          <p className="prose-body mt-3 max-w-xl text-lg">
            Software engineer with twenty years of retail context and an analyst&apos;s habit of
            asking why first.
          </p>
        </div>
        <div className="mt-8 flex gap-4">
          <MotionButtonLink
            href="/projects"
            className="bg-accent-bright text-background rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
          >
            See projects
          </MotionButtonLink>
          <MotionButtonLink
            href="/about"
            className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors"
          >
            About
          </MotionButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="section-h2">Featured work</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {featured.map((project) => (
            <li key={project.slug}>
              <MotionCardLink
                href={`/projects/${project.slug}`}
                className="border-border/30 hover:border-border/50 focus-visible:ring-accent/50 block rounded-lg border p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <h3 className="card-title">{project.title}</h3>
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
      </section>
    </>
  );
}
