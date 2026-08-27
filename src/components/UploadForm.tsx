"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch("/api/projects", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Error al subir el video");
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-4">
      <label
        htmlFor="video"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/50 px-6 py-12 text-center cursor-pointer hover:border-neutral-500 transition-colors"
      >
        <span className="text-sm text-neutral-400">
          {file ? file.name : "Haz clic para elegir un video (podcast, stream, entrevista...)"}
        </span>
        <input
          id="video"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!file || uploading}
        className="rounded-lg bg-white text-black font-medium py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
      >
        {uploading ? "Subiendo..." : "Generar clips con IA"}
      </button>
    </form>
  );
}
