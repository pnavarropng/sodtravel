"use client";

import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const MENU_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Sobre mí", href: "#sobre-mi" },
  { label: "Servicios", href: "#servicios" },
  { label: "Contacto", href: "#contacto" },
];

// The pass-behind-the-photo animation plays across the first HANDOFF share of
// the pinned track; the remaining share shrinks the logo down into the fixed
// header mark (its future menu button), cross-fading between the two.
const HANDOFF = 0.8;

export default function PuntoPngScene() {
  const introRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const personRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const vh = window.innerHeight;

      if (introRef.current && bgRef.current) {
        const p = clamp(window.scrollY / (vh * 0.9), 0, 1);
        introRef.current.style.opacity = String(1 - p);
        introRef.current.style.transform = `translate(-50%, calc(-50% - ${p * 40}px)) scale(${1 - p * 0.08})`;

        const gx = 28 - p * 20;
        const gy = 35 - p * 25;
        bgRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, #1c3d2c 0%, #0a0f0c 55%, #000000 100%)`;
      }

      if (trackRef.current && stageRef.current && logoRef.current && personRef.current) {
        const trackRect = trackRef.current.getBoundingClientRect();
        const total = trackRect.height - vh;
        const progress = total > 0 ? clamp(-trackRect.top / total, 0, 1) : 0;

        // logo.png and person.png are both full 1920x1080 layers from the same
        // composition, so they share one coordinate space: moving the whole
        // layer keeps the logo and photo aligned exactly as they were designed.
        const stageRect = stageRef.current.getBoundingClientRect();

        const passProgress = clamp(progress / HANDOFF, 0, 1);
        const dockProgress = clamp((progress - HANDOFF) / (1 - HANDOFF), 0, 1);

        const dx = passProgress * stageRect.width * 0.16 * (1 - dockProgress);
        const dy =
          passProgress * stageRect.height * 0.3 - dockProgress * stageRect.height * 0.42;
        const passScale = 1 - passProgress * 0.05;
        const logoScale = passScale * (1 - dockProgress * 0.86);
        logoRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${logoScale})`;
        logoRef.current.style.opacity = String(1 - dockProgress);

        const personY = passProgress * stageRect.height * -0.02;
        const personScale = 1 + passProgress * 0.02;
        personRef.current.style.transform = `translate3d(0, ${personY}px, 0) scale(${personScale})`;

        if (glowRef.current) {
          glowRef.current.style.opacity = String(0.35 + passProgress * 0.45);
        }

        if (headerRef.current) {
          headerRef.current.style.opacity = String(dockProgress);
          headerRef.current.style.transform = `scale(${0.85 + dockProgress * 0.15})`;
          headerRef.current.style.pointerEvents = dockProgress > 0.9 ? "auto" : "none";
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

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuContainerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <main className="relative bg-black">
      <div
        ref={bgRef}
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 28% 35%, #1c3d2c 0%, #0a0f0c 55%, #000000 100%)",
        }}
      />

      <div
        ref={headerRef}
        className="fixed inset-x-0 top-4 z-50 flex justify-center opacity-0"
        style={{ pointerEvents: "none" }}
      >
        <div ref={menuContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Abrir menú"
            className="flex items-center rounded-full bg-black/40 px-4 py-2 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/puntopng/logo-mark.png"
              alt="puntopng"
              className="h-5 w-auto select-none"
              draggable={false}
            />
          </button>

          {menuOpen && (
            <div className="absolute left-1/2 top-full mt-2 flex w-48 -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-black/80 py-1 ring-1 ring-white/10 backdrop-blur-sm">
              {MENU_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="relative z-10 flex h-screen items-center justify-center overflow-hidden">
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

      <section ref={trackRef} className="relative z-10 h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
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
