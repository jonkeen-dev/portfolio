import MotionButtonLink from "@/components/motion/motion-button-link";
import MotionCardLink from "@/components/motion/motion-card-link";
import { getFeaturedProjects } from "@/lib/projects";

const featured = getFeaturedProjects();

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
            Twenty years in retail ops and analysis — now building software with the same habit of
            asking why first.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <MotionButtonLink
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent-bright text-background rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
          >
            View resume
          </MotionButtonLink>
          <MotionButtonLink
            href="/about"
            className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors"
          >
            About
          </MotionButtonLink>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="section-h2">Featured work</h2>
          <ul
            className={`mt-6 grid gap-6 ${featured.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}
          >
            {featured.map((project) => (
              <li key={project.slug}>
                <MotionCardLink
                  href={`/projects/${project.slug}`}
                  className="border-border/30 hover:border-border/50 focus-visible:ring-accent/50 block rounded-lg border p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <h3 className="card-title">{project.title}</h3>
                  <p className="text-foreground-secondary mt-2 text-sm">{project.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.slice(0, 4).map((tag) => (
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
      )}
    </>
  );
}
