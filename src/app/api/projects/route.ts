import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { ensureDir, listProjects, saveProject, sourceVideoPath } from "@/lib/storage";
import type { Project } from "@/lib/types";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo 'video'" }, { status: 400 });
  }
  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "El archivo debe ser un video" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "El video supera el límite de 500MB" }, { status: 400 });
  }

  const projectId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "video.mp4";
  const filePath = sourceVideoPath(projectId, safeName);

  await ensureDir(path.dirname(filePath));
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const project: Project = {
    id: projectId,
    createdAt: new Date().toISOString(),
    status: "uploaded",
    sourceFilename: safeName,
    sourcePath: filePath,
  };
  await saveProject(project);

  // Kick off the AI pipeline in the background; the client polls
  // GET /api/projects/[id] for progress.
  void runPipeline(projectId);

  return NextResponse.json({ project }, { status: 201 });
}
