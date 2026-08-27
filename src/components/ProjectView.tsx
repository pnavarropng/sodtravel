"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";

const STEPS: { status: Project["status"]; label: string }[] = [
  { status: "uploaded", label: "Video subido" },
  { status: "transcribing", label: "Transcribiendo audio" },
  { status: "analyzing", label: "Buscando los mejores momentos" },
  { status: "rendering", label: "Generando clips verticales" },
  { status: "done", label: "Listo" },
];

function stepIndex(status: Project["status"]) {
  if (status === "error") return -1;
  return STEPS.findIndex((s) => s.status === status);
}

export default function ProjectView({ initialProject }: { initialProject: Project }) {
  const [project, setProject] = useState(initialProject);

  useEffect(() => {
    if (project.status === "done" || project.status === "error") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/projects/${project.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setProject(data.project);
    }, 3000);

    return () => clearInterval(interval);
  }, [project.id, project.status]);

  const currentStep = stepIndex(project.status);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">{project.sourceFilename}</h1>
        <p className="text-sm text-neutral-500">Proyecto {project.id}</p>
      </div>

      {project.status === "error" ? (
        <div className="max-w-md rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          Ocurrió un error: {project.error}
        </div>
      ) : (
        <ol className="flex w-full max-w-xl flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step.status} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  i < currentStep
                    ? "bg-green-600 text-white"
                    : i === currentStep
                      ? "bg-white text-black animate-pulse"
                      : "bg-neutral-800 text-neutral-500"
                }`}
              >
                {i < currentStep ? "✓" : i + 1}
              </span>
              <span className={i <= currentStep ? "text-neutral-100" : "text-neutral-500"}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {project.clips && project.clips.length > 0 && (
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {project.clips.map((clip) => (
            <div
              key={clip.id}
              className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-3"
            >
              <div className="aspect-9/16 overflow-hidden rounded-lg bg-neutral-900">
                {clip.status === "done" ? (
                  <video
                    src={`/api/projects/${project.id}/clips/${clip.id}`}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                    {clip.status === "error" ? "Error al renderizar" : "Renderizando..."}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium">{clip.highlight.title}</p>
              <p className="text-xs text-neutral-500">Score: {Math.round(clip.highlight.score)}/100</p>
              {clip.status === "done" && (
                <a
                  href={`/api/projects/${project.id}/clips/${clip.id}`}
                  download
                  className="text-xs text-neutral-300 underline underline-offset-2"
                >
                  Descargar
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
