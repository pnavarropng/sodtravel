import type { Metadata } from "next";
import Link from "next/link";
import UploadForm from "@/components/UploadForm";
import { listProjects } from "@/lib/storage";

export const metadata: Metadata = {
  title: "ClipGen — Clips virales con IA",
  description: "Sube un video largo y obtén clips cortos listos para redes sociales.",
};

export default async function Home() {
  const projects = await listProjects();

  return (
    <main className="flex flex-1 flex-col items-center gap-12 px-6 py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">ClipGen</h1>
        <p className="max-w-md text-neutral-400">
          Sube un video largo y la IA encuentra los mejores momentos, los recorta en
          vertical y les agrega subtítulos automáticos, listos para TikTok, Reels y
          Shorts.
        </p>
      </div>

      <UploadForm />

      {projects.length > 0 && (
        <div className="w-full max-w-lg">
          <h2 className="mb-3 text-sm font-medium text-neutral-400">Proyectos recientes</h2>
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3 hover:border-neutral-600 transition-colors"
                >
                  <span className="truncate">{p.sourceFilename}</span>
                  <span className="text-xs uppercase text-neutral-500">{p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
