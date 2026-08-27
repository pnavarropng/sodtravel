"use client";

import { useEffect, useRef } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PuntoPngScene() {
  const introRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const personRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const vh = window.innerHeight;

      if (introRef.current) {
        const p = clamp(window.scrollY / (vh * 0.9), 0, 1);
        introRef.current.style.opacity = String(1 - p);
        introRef.current.style.transform = `translate(-50%, calc(-50% - ${p * 40}px)) scale(${1 - p * 0.08})`;
      }

      if (trackRef.current && stageRef.current && logoRef.current && personRef.current) {
        const trackRect = trackRef.current.getBoundingClientRect();
        const total = trackRect.height - vh;
        const progress = total > 0 ? clamp(-trackRect.top / total, 0, 1) : 0;

        // logo.png and person.png are both full 1920x1080 layers from the same
        // composition, so they share one coordinate space: moving the whole
        // layer keeps the logo and photo aligned exactly as they were designed.
        const stageRect = stageRef.current.getBoundingClientRect();

        const dx = progress * stageRect.width * 0.16;
        const dy = progress * stageRect.height * 0.3;
        const logoScale = 1 - progress * 0.05;
        logoRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${logoScale})`;

        const personY = progress * stageRect.height * -0.02;
        const personScale = 1 + progress * 0.02;
        personRef.current.style.transform = `translate3d(0, ${personY}px, 0) scale(${personScale})`;

        if (glowRef.current) {
          glowRef.current.style.opacity = String(0.35 + progress * 0.45);
        }
      }
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="relative bg-black">
      <section className="relative flex h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_28%_35%,#1c3d2c_0%,#0a0f0c_55%,#000000_100%)]">
        <div
          ref={introRef}
          className="absolute left-1/2 top-1/2 w-full max-w-3xl px-6 text-center will-change-transform"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/puntopng/intro.png"
            alt="Ponle punto y inicio"
            className="mx-auto w-full select-none"
            draggable={false}
          />
        </div>

        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
          <span className="animate-bounce">Scroll</span>
        </div>
      </section>

      <section ref={trackRef} className="relative h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden bg-[radial-gradient(circle_at_24%_30%,#1c3d2c_0%,#0a0f0c_55%,#000000_100%)]">
          <div
            ref={glowRef}
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              background:
                "radial-gradient(circle at 55% 58%, rgba(74,167,120,0.55) 0%, transparent 60%)",
            }}
          />

          <div className="flex h-full w-full items-center justify-center px-4">
            <div
              ref={stageRef}
              className="relative"
              style={{
                width: "min(1800px, 100%, calc(100vh * 16 / 9))",
                aspectRatio: "1920 / 1080",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={logoRef}
                src="/puntopng/logo.png"
                alt="puntopng"
                className="absolute inset-0 z-10 h-full w-full select-none object-contain will-change-transform"
                draggable={false}
              />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={personRef}
                src="/puntopng/person.png"
                alt="Fundador de puntopng"
                className="absolute inset-0 z-20 h-full w-full select-none object-contain will-change-transform"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
