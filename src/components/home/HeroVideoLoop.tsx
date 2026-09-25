"use client";
import { useEffect, useRef, useState } from "react";
import { HERO_PLAYLIST, type HeroClip } from "@/lib/hero-playlist";

function canAutoplay() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroVideoLoop() {
  const clips = HERO_PLAYLIST.filter((c) => c.src);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState<0 | 1>(0);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const indexRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const clip: HeroClip | undefined = clips[index];

  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => {
    if (!clips.length) return;
    const a = aRef.current;
    const b = bRef.current;
    if (!a) return;

    const play = async (el: HTMLVideoElement) => {
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      try { await el.play(); } catch { /* poster kalır */ }
    };

    const loadAt = (el: HTMLVideoElement, i: number) => {
      const next = clips[i % clips.length];
      if (!next) return;
      if (el.getAttribute("src") !== next.src) {
        el.setAttribute("src", next.src);
        el.poster = next.poster;
        el.load();
      }
    };

    loadAt(a, 0);
    if (b && clips[1]) loadAt(b, 1);

    const vis = () => {
      const el = active === 0 ? a : b;
      if (!el) return;
      if (document.hidden) el.pause();
      else if (canAutoplay()) void play(el);
    };

    const io = new IntersectionObserver(([entry]) => {
      const el = active === 0 ? aRef.current : bRef.current;
      if (!el) return;
      if (entry?.isIntersecting && canAutoplay() && !document.hidden) void play(el);
      else el.pause();
    }, { threshold: 0.35 });

    if (wrapRef.current) io.observe(wrapRef.current);
    document.addEventListener("visibilitychange", vis);
    if (canAutoplay()) void play(a);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [clips[0]?.src, active]);

  const onEnded = (from: 0 | 1) => {
    if (clips.length < 2) {
      const el = from === 0 ? aRef.current : bRef.current;
      if (el) { el.currentTime = 0; void el.play().catch(() => {}); }
      return;
    }
    const nextIndex = (indexRef.current + 1) % clips.length;
    const nextSlot: 0 | 1 = from === 0 ? 1 : 0;
    const nextEl = nextSlot === 0 ? aRef.current : bRef.current;
    const preloadEl = from === 0 ? aRef.current : bRef.current;
    const preloadIndex = (nextIndex + 1) % clips.length;

    if (nextEl) {
      const next = clips[nextIndex];
      if (next && nextEl.getAttribute("src") !== next.src) {
        nextEl.setAttribute("src", next.src);
        nextEl.poster = next.poster;
        nextEl.load();
      }
      nextEl.muted = true;
      void nextEl.play().catch(() => {});
    }
    if (preloadEl && clips[preloadIndex]) {
      const pre = clips[preloadIndex];
      preloadEl.setAttribute("src", pre.src);
      preloadEl.poster = pre.poster;
      preloadEl.load();
    }
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setActive(nextSlot);
  };

  if (!clip) {
    return <img src="/showcase/ai-production-studio.webp" alt="" className="h-full w-full object-cover" />;
  }

  const reduced = typeof window !== "undefined" && !canAutoplay();

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      {reduced ? (
        <img src={clip.poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <video
            ref={aRef}
            muted
            playsInline
            preload="auto"
            poster={clips[0]?.poster}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${active === 0 ? "opacity-100" : "opacity-0"}`}
            onEnded={() => onEnded(0)}
          />
          <video
            ref={bRef}
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${active === 1 ? "opacity-100" : "opacity-0"}`}
            onEnded={() => onEnded(1)}
          />
        </>
      )}
      <a href={clip.href} className="absolute inset-0 z-10" aria-label={clip.title} />
    </div>
  );
}
