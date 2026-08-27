export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "analyzing"
  | "rendering"
  | "done"
  | "error";

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: TranscriptWord[];
}

export interface Transcript {
  language: string;
  segments: TranscriptSegment[];
}

export interface Highlight {
  id: string;
  title: string;
  start: number;
  end: number;
  score: number;
  reason: string;
}

export type ClipStatus = "pending" | "rendering" | "done" | "error";

export interface Clip {
  id: string;
  highlight: Highlight;
  status: ClipStatus;
  outputPath?: string;
  error?: string;
}

export interface Project {
  id: string;
  createdAt: string;
  status: ProjectStatus;
  sourceFilename: string;
  sourcePath: string;
  durationSeconds?: number;
  transcript?: Transcript;
  highlights?: Highlight[];
  clips?: Clip[];
  error?: string;
}
