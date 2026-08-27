import { randomUUID } from "crypto";
import { findHighlights } from "./analyze";
import { probeDuration } from "./ffmpeg";
import { renderClip } from "./render";
import { clipOutputPath, ensureDir, clipsDir, loadProject, saveProject } from "./storage";
import { transcribeVideo } from "./transcribe";
import type { Clip, Project } from "./types";

async function updateProject(projectId: string, patch: Partial<Project>): Promise<Project> {
  const current = await loadProject(projectId);
  if (!current) throw new Error(`Proyecto ${projectId} no encontrado`);
  const next = { ...current, ...patch };
  await saveProject(next);
  return next;
}

export async function runPipeline(projectId: string): Promise<void> {
  try {
    const project = await loadProject(projectId);
    if (!project) throw new Error(`Proyecto ${projectId} no encontrado`);

    const duration = await probeDuration(project.sourcePath);
    await updateProject(projectId, { status: "transcribing", durationSeconds: duration });

    const transcript = await transcribeVideo(project.sourcePath);
    await updateProject(projectId, { status: "analyzing", transcript });

    const highlights = await findHighlights(transcript);
    const clips: Clip[] = highlights.map((highlight) => ({
      id: randomUUID(),
      highlight,
      status: "pending",
    }));
    await updateProject(projectId, { status: "rendering", highlights, clips });

    await ensureDir(clipsDir(projectId));

    for (const clip of clips) {
      try {
        clip.status = "rendering";
        await updateProject(projectId, { clips: [...clips] });

        const outputPath = clipOutputPath(projectId, clip.id);
        await renderClip(project.sourcePath, transcript.segments, clip.highlight, outputPath);

        clip.status = "done";
        clip.outputPath = outputPath;
      } catch (err) {
        clip.status = "error";
        clip.error = err instanceof Error ? err.message : String(err);
      }
      await updateProject(projectId, { clips: [...clips] });
    }

    await updateProject(projectId, { status: "done" });
  } catch (err) {
    await updateProject(projectId, {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
