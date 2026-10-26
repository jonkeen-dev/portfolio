import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CaseStudy from "@/components/sections/case-study";
import { getPublishedProjectBySlug, getPublishedProjects } from "@/lib/projects";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getPublishedProjectBySlug(slug);
  if (!project) {
    notFound();
  }
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getPublishedProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <CaseStudy project={project} />
    </section>
  );
}
