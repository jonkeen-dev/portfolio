import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

import LinkedInIcon from "@/components/icons/linkedin-icon";
import MotionIconLink from "@/components/motion/motion-icon-link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Jon Keen — software engineering student with a background in retail operations and business analysis.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <h1 className="page-h1">About</h1>

      <div className="mt-12">
        <h2 className="section-h2">Now</h2>
        <p className="prose-body mt-3">
          I&apos;m a dad and a husband of almost 15 years. I also work full time and go to school
          full time. Outside of that, I&apos;m building this site from scratch so I can learn by
          doing — every page here is a choice I made and can explain. Whatever time is left goes to
          family.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="section-h2">Background</h2>
        <p className="prose-body mt-3">
          I spent 18 years in retail operations. I started in stock, moved into produce, and became
          a Produce Manager. Then I joined a year-long Store Manager training program that rotated
          me through every part of the store. I later ran kitchen, bakery, cafe, and catering as
          Food Service Manager, then moved into Assistant Store Manager. After that I spent two
          years as a Business Analyst, helping connect what the business needed with the systems
          behind it.
        </p>
        <p className="prose-body mt-3">
          The through-line was always the same: figure out how things really work, then make them
          better. That&apos;s what pulled me into software. I got tired of only translating
          requirements — I wanted to build the solutions myself.
        </p>

        <ul className="prose-body mt-3 list-disc pl-5 text-sm">
          <li>18 years in retail operations, up through Produce and Food Service management</li>
          <li>2 years as a Business Analyst between business needs and technical systems</li>
          <li>Now building real software with JavaScript, TypeScript, React, and databases</li>
        </ul>
      </div>

      <div className="mt-12">
        <h2 className="section-h2">Currently learning</h2>
        <p className="prose-body mt-3">
          My focus is JavaScript, TypeScript, and React — building real projects to go deeper than
          class alone. I&apos;m also getting stronger with SQL and databases, and I have a project
          planned around that.
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
