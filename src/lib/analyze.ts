import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { Highlight, Transcript } from "./types";

const MIN_CLIP_SECONDS = 20;
const MAX_CLIP_SECONDS = 90;
const MAX_HIGHLIGHTS = 8;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no está configurada");
  }
  return new Anthropic({ apiKey });
}

function formatTranscript(transcript: Transcript): string {
  return transcript.segments
    .map((seg) => `[${seg.start.toFixed(1)}-${seg.end.toFixed(1)}] ${seg.text}`)
    .join("\n");
}

const HIGHLIGHT_TOOL = {
  name: "submit_highlights",
  description: "Envía la lista de momentos destacados encontrados en la transcripción.",
  input_schema: {
    type: "object" as const,
    properties: {
      highlights: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string", description: "Título corto y llamativo para el clip" },
            start: { type: "number", description: "Segundo de inicio" },
            end: { type: "number", description: "Segundo de fin" },
            score: { type: "number", description: "Puntaje de viralidad de 0 a 100" },
            reason: { type: "string", description: "Por qué este momento funcionaría como clip corto" },
          },
          required: ["title", "start", "end", "score", "reason"],
        },
      },
    },
    required: ["highlights"],
  },
};

export async function findHighlights(transcript: Transcript): Promise<Highlight[]> {
  const client = getClient();
  const transcriptText = formatTranscript(transcript);

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tools: [HIGHLIGHT_TOOL],
    tool_choice: { type: "tool", name: "submit_highlights" },
    messages: [
      {
        role: "user",
        content: `Eres un editor experto en encontrar los mejores momentos de videos largos (podcasts, streams, entrevistas) para convertirlos en clips cortos virales para TikTok/Reels/Shorts, al estilo de Opus Clips.

Analiza esta transcripción con timestamps y elige entre 3 y ${MAX_HIGHLIGHTS} momentos que funcionen bien como clips independientes: con un gancho claro al inicio, una idea completa, y potencial de retención.

Reglas:
- Cada clip debe durar entre ${MIN_CLIP_SECONDS} y ${MAX_CLIP_SECONDS} segundos.
- Los segmentos no deben solaparse.
- Usa los timestamps reales de la transcripción.
- Ordena por score descendente.

Transcripción:
${transcriptText}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("El modelo no devolvió highlights");
  }

  const input = toolUse.input as {
    highlights: Array<{ title: string; start: number; end: number; score: number; reason: string }>;
  };

  return input.highlights
    .filter((h) => h.end > h.start)
    .map((h) => ({
      id: randomUUID(),
      title: h.title,
      start: h.start,
      end: h.end,
      score: h.score,
      reason: h.reason,
    }))
    .sort((a, b) => b.score - a.score);
}
