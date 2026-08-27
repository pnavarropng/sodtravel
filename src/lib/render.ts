import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import ffmpeg from "./ffmpeg";
import { buildAssSubtitles } from "./subtitles";
import type { Highlight, TranscriptSegment } from "./types";

const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;

function escapeForFilter(filePath: string): string {
  // ffmpeg filter graphs treat ':' and '\' specially, so they must be escaped
  // when a path is embedded inside a filter option (e.g. subtitles=path).
  return filePath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
}

export async function renderClip(
  sourceVideoPath: string,
  segments: TranscriptSegment[],
  highlight: Highlight,
  outputPath: string
): Promise<void> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "clipgen-render-"));
  const assPath = path.join(tmpDir, "captions.ass");

  try {
    const assContent = buildAssSubtitles(segments, highlight.start, highlight.end);
    await writeFile(assPath, assContent, "utf-8");

    const duration = highlight.end - highlight.start;
    const subtitlesFilter = `subtitles=${escapeForFilter(assPath)}`;

    const filterComplex = [
      `[0:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase,crop=${TARGET_WIDTH}:${TARGET_HEIGHT},gblur=sigma=20[bg]`,
      `[0:v]scale=${TARGET_WIDTH}:-2[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2,${subtitlesFilter}[outv]`,
    ].join(";");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(sourceVideoPath)
        .setStartTime(highlight.start)
        .setDuration(duration)
        .complexFilter(filterComplex)
        .outputOptions(["-map", "[outv]", "-map", "0:a?"])
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-preset", "veryfast", "-crf", "21", "-movflags", "+faststart"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
