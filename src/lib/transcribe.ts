import { createReadStream } from "fs";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import OpenAI from "openai";
import { extractAudio } from "./ffmpeg";
import type { Transcript, TranscriptSegment, TranscriptWord } from "./types";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada");
  }
  return new OpenAI({ apiKey });
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface WhisperVerboseResponse {
  language?: string;
  segments?: WhisperSegment[];
  words?: WhisperWord[];
}

export async function transcribeVideo(videoPath: string): Promise<Transcript> {
  const client = getClient();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "clipgen-audio-"));
  const audioPath = path.join(tmpDir, "audio.mp3");

  try {
    await extractAudio(videoPath, audioPath);

    const response = (await client.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    })) as unknown as WhisperVerboseResponse;

    const words = response.words ?? [];
    const segments: TranscriptSegment[] = (response.segments ?? []).map((seg) => {
      const segmentWords: TranscriptWord[] = words
        .filter((w) => w.start >= seg.start && w.end <= seg.end)
        .map((w) => ({ word: w.word, start: w.start, end: w.end }));
      return {
        id: seg.id,
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        words: segmentWords,
      };
    });

    return {
      language: response.language ?? "unknown",
      segments,
    };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
