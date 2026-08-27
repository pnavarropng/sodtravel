import { notFound } from "next/navigation";
import ProjectView from "@/components/ProjectView";
import { loadProject } from "@/lib/storage";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await loadProject(id);

  if (!project) notFound();

  return <ProjectView initialProject={project} />;
}
