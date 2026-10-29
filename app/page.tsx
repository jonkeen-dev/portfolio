import MotionButtonLink from "@/components/motion/motion-button-link";
import MotionCardLink from "@/components/motion/motion-card-link";
import { getFeaturedProjects } from "@/lib/projects";

const featured = getFeaturedProjects();

const experience = [
  {
    kicker: "18 years",
    title: "Grocery retail",
    detail: "Stock to Assistant Store Manager, leading teams of 200+",
  },
  {
    kicker: "2024",
    title: "Business analyst",
    detail: "Corporate IT at K-VA-T Food Stores",
  },
  {
    kicker: "Now",
    title: "Scrum Master",
    detail: "Sprints, QA, and an enterprise system upgrade",
  },
  {
    kicker: "2027",
    title: "Software engineer",
    detail: "B.S. from WGU, building projects along the way",
    accent: true,
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-32 pb-16">
      <section>
        <p className="text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs tracking-[0.16em] uppercase">
          <span>Software developer</span>
          <span aria-hidden="true" className="bg-foreground-muted/70 h-px w-10 shrink-0" />
          <span>B.S. Software Engineering · Expected 2027</span>
        </p>
        {/* prettier-ignore */}
        <h1 className="page-h1-hero mt-5">Jon Keen<span className="text-accent-bright" aria-hidden="true">.</span></h1>
        <p className="text-foreground-secondary mt-6 text-xl leading-relaxed sm:text-2xl sm:leading-snug">
          I started in stock at a grocery store and spent 18 years working my way into store
          management. In 2024 I moved to the IT side. Now I&apos;m learning to build the software
          myself.
        </p>

        <ol
          aria-label="Experience"
          className="border-foreground/15 mt-10 grid list-none grid-cols-2 gap-x-6 gap-y-8 border-t pt-8 lg:mt-12 lg:grid-cols-4 lg:gap-x-8"
        >
          {experience.map((item) => (
            <li key={item.kicker}>
              <p
                className={`font-mono text-xs tracking-wide ${
                  "accent" in item && item.accent
                    ? "text-accent-bright"
                    : "text-foreground-secondary"
                }`}
              >
                {item.kicker}
              </p>
              <p className="text-foreground mt-2 font-medium">{item.title}</p>
              <p className="text-foreground-muted mt-1 text-sm leading-relaxed">{item.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <MotionButtonLink
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-foreground text-background hover:bg-foreground/90 focus-visible:outline-accent-bright rounded-md px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            View resume
            <span className="sr-only"> (opens in a new tab)</span>
          </MotionButtonLink>
          <MotionButtonLink
            href="/about"
            className="text-foreground decoration-accent-bright hover:text-accent-bright focus-visible:outline-accent-bright underline decoration-2 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            About me →
          </MotionButtonLink>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-foreground/15 mt-16 border-t pt-10 sm:mt-20">
          <h2 className="section-h2">Selected work</h2>
          <ul className="mt-6 grid gap-6">
            {featured.map((project) => (
              <li key={project.slug}>
                <MotionCardLink
                  href={`/projects/${project.slug}`}
                  className="border-accent/75 bg-background-secondary hover:border-accent focus-visible:ring-accent block rounded-lg border p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:p-8"
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
    </div>
  );
}
