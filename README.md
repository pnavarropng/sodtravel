# ClipGen

Clon funcional del concepto de [Opus Clips](https://www.opus.pro/): subes un video
largo (podcast, stream, entrevista) y la IA:

1. Transcribe el audio con timestamps por palabra (OpenAI Whisper).
2. Analiza la transcripción y elige los mejores momentos para clips cortos (Claude).
3. Corta cada momento, lo reencuadra a formato vertical 9:16 (con fondo difuminado)
   y le quema subtítulos animados estilo TikTok (ffmpeg).

## Requisitos

- Node.js 20+
- Una API key de [OpenAI](https://platform.openai.com/api-keys) (transcripción)
- Una API key de [Anthropic](https://console.anthropic.com/) (detección de highlights)

No necesitas instalar `ffmpeg` en el sistema: se usa el binario embebido de
`@ffmpeg-installer/ffmpeg` / `@ffprobe-installer/ffprobe`.

## Setup

```bash
cp .env.example .env.local
# completa OPENAI_API_KEY y ANTHROPIC_API_KEY en .env.local

npm install
npm run dev
```

Abre http://localhost:3000, sube un video y espera a que el pipeline termine.

## Arquitectura

```
src/
  lib/
    types.ts        # Project, Transcript, Highlight, Clip
    storage.ts       # "DB" basada en archivos JSON + carpetas por proyecto (./data)
    ffmpeg.ts         # wrapper de fluent-ffmpeg (probe, extracción de audio)
    transcribe.ts     # audio -> transcripción con timestamps (OpenAI Whisper)
    analyze.ts        # transcripción -> highlights (Claude, tool use)
    subtitles.ts       # transcripción -> subtítulos .ass estilo pop-on
    render.ts          # corte + reencuadre vertical + subtítulos quemados (ffmpeg)
    pipeline.ts        # orquesta todo el flujo y persiste el progreso
  app/
    page.tsx                                 # subida + lista de proyectos
    projects/[id]/page.tsx                    # estado del pipeline + clips
    api/projects/route.ts                     # POST subir video, GET listar
    api/projects/[id]/route.ts                 # GET estado del proyecto
    api/projects/[id]/clips/[clipId]/route.ts   # streaming del clip (con Range)
```

Cada proyecto se guarda en `data/projects/<id>/` (video fuente, `project.json` con
transcripción/highlights, y los clips renderizados). Esta carpeta no se versiona.

## Limitaciones conocidas / próximos pasos

- El pipeline corre en segundo plano dentro del propio proceso de Next.js
  (`void runPipeline(...)`). Para producción real conviene moverlo a una cola de
  trabajos (BullMQ, Inngest, etc.) y no depender de un proceso serverless de larga
  duración.
- El reencuadre vertical usa un crop centrado con fondo difuminado; no hay
  detección de rostro/speaker tracking (lo que Opus Clips sí ofrece).
- No hay autenticación ni multiusuario: es un solo pool de proyectos compartido.
- El almacenamiento es el filesystem local; para desplegar en Vercel u otro
  entorno sin disco persistente hay que migrar a S3/R2 u otro storage externo.
