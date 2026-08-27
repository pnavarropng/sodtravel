import type { TranscriptSegment, TranscriptWord } from "./types";

const WORDS_PER_CAPTION = 3;

function toAssTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const cs = Math.round((clamped - Math.floor(clamped)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function escapeAssText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/[{}]/g, "");
}

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Arial Black,84,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,6,0,2,60,60,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

/**
 * Builds a .ass subtitle file for a clip, grouping transcript words into
 * short pop-on captions (word-by-word, TikTok-style) relative to clipStart.
 */
export function buildAssSubtitles(
  segments: TranscriptSegment[],
  clipStart: number,
  clipEnd: number
): string {
  const words: TranscriptWord[] = segments
    .flatMap((seg) => seg.words)
    .filter((w) => w.start >= clipStart && w.end <= clipEnd)
    .sort((a, b) => a.start - b.start);

  const lines: string[] = [];

  for (let i = 0; i < words.length; i += WORDS_PER_CAPTION) {
    const chunk = words.slice(i, i + WORDS_PER_CAPTION);
    if (chunk.length === 0) continue;
    const start = chunk[0].start - clipStart;
    const end = chunk[chunk.length - 1].end - clipStart;
    const text = escapeAssText(chunk.map((w) => w.word.trim()).join(" ").toUpperCase());
    if (!text) continue;
    lines.push(
      `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Caption,,0,0,0,,${text}`
    );
  }

  return ASS_HEADER + lines.join("\n") + "\n";
}
