import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

import LinkedInIcon from "@/components/icons/linkedin-icon";
import MotionIconLink from "@/components/motion/motion-icon-link";

export const metadata: Metadata = {
  title: "About — jonkeen.dev",
  description: "About Jon Keen — software engineering student, former retail operations leader.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <h1 className="page-h1">About</h1>

      <div className="mt-12">
        <h2 className="section-h2">Now</h2>
        <p className="prose-body mt-3">
          I&apos;m a father and husband of almost 15 years, a full-time student, and a full-time
          employee. Outside of work and classes, I&apos;m building this portfolio from scratch to
          learn by doing. Every page is a decision I made and stood by. The rest of my time goes to
          family.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="section-h2">Background</h2>
        <p className="prose-body mt-3">
          I spent 18 years working in retail operations. I began in stock roles, moved into fresh
          produce, and became a Produce Manager. After that I joined a year-long Store Manager
          training program that rotated me through every job in the store. I later ran a large food
          service operation (kitchen, bakery, cafe, catering) as Food Service Manager. From there I
          became an Assistant Store Manager and then spent two years as a Business Analyst,
          connecting business needs with the systems that support them.
        </p>
        <p className="prose-body mt-3">
          The common thread was always the same: I wanted to understand how things actually worked
          and then make them better. That is what led me to software engineering. I got tired of
          just explaining what the business needed and decided to build the solutions myself.
        </p>

        {/* Compact journey milestones */}
        <ul className="prose-body mt-3 list-disc pl-5 text-sm">
          <li>18 years in retail operations, rising to Produce Manager and Food Service Manager</li>
          <li>2 years as a Business Analyst linking business goals and technical systems</li>
          <li>Now building real software (Next.js, React, and SQL-heavy projects)</li>
        </ul>
      </div>

      <div className="mt-12">
        <h2 className="section-h2">Currently learning</h2>
        <p className="prose-body mt-3">
          Right now I&apos;m focused on JavaScript, TypeScript, and React by building real projects
          that go beyond what I learn in class. I also want to get much stronger with SQL and
          databases, and I&apos;m working on a project in that area.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="section-h2">Contact</h2>
        <p className="prose-body mt-3">
          Email is the best way to reach me. You can also find me on LinkedIn or GitHub.
        </p>
        <div className="mt-4 flex gap-5">
          <MotionIconLink
            href="mailto:jon@jonkeen.dev"
            aria-label="Email"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <Mail size={20} />
          </MotionIconLink>
          <MotionIconLink
            href="https://www.linkedin.com/in/jonkeen85/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <LinkedInIcon size={20} />
          </MotionIconLink>
          <MotionIconLink
            href="https://github.com/jonkeen-dev"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <SiGithub size={20} />
          </MotionIconLink>
        </div>
      </div>
    </section>
  );
}
