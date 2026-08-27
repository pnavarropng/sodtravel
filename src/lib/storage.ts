import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import type { Project } from "./types";

const DATA_ROOT = process.env.DATA_ROOT ?? path.join(process.cwd(), "data");

export function projectDir(projectId: string) {
  return path.join(DATA_ROOT, "projects", projectId);
}

export function sourceVideoPath(projectId: string, filename: string) {
  return path.join(projectDir(projectId), "source", filename);
}

export function clipsDir(projectId: string) {
  return path.join(projectDir(projectId), "clips");
}

export function clipOutputPath(projectId: string, clipId: string) {
  return path.join(clipsDir(projectId), `${clipId}.mp4`);
}

function metaPath(projectId: string) {
  return path.join(projectDir(projectId), "project.json");
}

export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function saveProject(project: Project) {
  await ensureDir(projectDir(project.id));
  await writeFile(metaPath(project.id), JSON.stringify(project, null, 2), "utf-8");
}

export async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const raw = await readFile(metaPath(projectId), "utf-8");
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}

export async function listProjects(): Promise<Project[]> {
  const root = path.join(DATA_ROOT, "projects");
  try {
    const ids = await readdir(root);
    const projects = await Promise.all(ids.map((id) => loadProject(id)));
    return projects
      .filter((p): p is Project => p !== null)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}
