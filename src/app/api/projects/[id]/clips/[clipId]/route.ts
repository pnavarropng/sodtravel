import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { loadProject } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  const { id, clipId } = await params;
  const project = await loadProject(id);
  const clip = project?.clips?.find((c) => c.id === clipId);

  if (!project || !clip || clip.status !== "done" || !clip.outputPath) {
    return NextResponse.json({ error: "Clip no disponible" }, { status: 404 });
  }

  const { size } = await stat(clip.outputPath);
  const range = request.headers.get("range");

  if (!range) {
    const stream = Readable.toWeb(createReadStream(clip.outputPath)) as ReadableStream;
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
      },
    });
  }

  const match = /bytes=(\d+)-(\d+)?/.exec(range);
  const start = match ? Number(match[1]) : 0;
  const end = match && match[2] ? Number(match[2]) : size - 1;
  const chunkSize = end - start + 1;

  const stream = Readable.toWeb(
    createReadStream(clip.outputPath, { start, end })
  ) as ReadableStream;

  return new NextResponse(stream, {
    status: 206,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(chunkSize),
      "Accept-Ranges": "bytes",
    },
  });
}
