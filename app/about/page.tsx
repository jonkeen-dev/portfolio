import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

import LinkedInIcon from "@/components/icons/linkedin-icon";

export const metadata: Metadata = {
  title: "About — jonkeen.dev",
  description: "About Jon Keen — software engineering student, former retail operations leader.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <h1 className="text-foreground text-4xl font-medium tracking-tight">About</h1>

      <div className="mt-12">
        <h2 className="text-foreground text-xl font-medium">Now</h2>
        <p className="text-foreground-secondary mt-3 text-base leading-relaxed">
          Father, husband of almost 15 years, full-time student, and full-time employee. Outside of
          work and classes I&apos;m building this portfolio from scratch as a way to learn by doing —
          every page here is a decision I had to make and defend. Whatever time is left goes to
          family.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-foreground text-xl font-medium">Background</h2>
        <p className="text-foreground-secondary mt-3 text-base leading-relaxed">
          I spent 18 years in retail operations. I started in stock positions, moved into fresh
          produce, and worked my way up to Produce Manager. From there I entered a 52-week Store
          Manager Trainee program — a rotation through every operational role in the building. That
          led to Food Service Manager, where I ran a kitchen, bakery, cafe, and catering operation
          alongside the retail sales floor for the department. I moved into Assistant Store Manager
          and eventually transitioned into a Business Analyst role, where I spent two years bridging
          the gap between business needs and technical systems.
        </p>
        <p className="text-foreground-secondary mt-3 text-base leading-relaxed">
          The through-line across all of it: figuring out how systems actually work, then making
          them work better. That instinct is what pulled me toward software engineering — I got
          tired of translating requirements and wanted to build the solutions myself.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-foreground text-xl font-medium">Currently learning</h2>
        <p className="text-foreground-secondary mt-3 text-base leading-relaxed">
          My focus right now is JavaScript, TypeScript, and React — building real things to deepen
          what I&apos;m learning in class. I&apos;m also looking to get stronger with SQL and
          database management, and I&apos;m planning a project specifically around that.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-foreground text-xl font-medium">Contact</h2>
        <p className="text-foreground-secondary mt-3 text-base leading-relaxed">
          Email is the best way to reach me. You can also find me on LinkedIn or GitHub.
        </p>
        <div className="mt-4 flex gap-5">
          <a
            href="mailto:jon@jonkeen.dev"
            aria-label="Email"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <Mail size={20} />
          </a>
          <a
            href="https://www.linkedin.com/in/jonkeen85/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <LinkedInIcon size={20} />
          </a>
          <a
            href="https://github.com/jonkeen-dev"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <SiGithub size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
