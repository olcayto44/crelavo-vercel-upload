"use client";

import { memo, useEffect, useRef } from "react";

const DESKTOP_SRC = "/hero/hero-04-giant-fashion-city-1920x1080.mp4";
const MOBILE_SRC = "/hero/hero-04-giant-fashion-city-1080x1920.mp4";
const POSTER_SRC = "/hero/hero-04-giant-fashion-city-poster.jpg";
const FALLBACK_SRC = "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4";

function HeroReelInner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const pick = () => {
      const next = window.matchMedia("(min-width: 768px)").matches ? DESKTOP_SRC : MOBILE_SRC;
      if (video.getAttribute("src") !== next) {
        video.src = next;
        video.load();
      }
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      void video.play().catch(() => {});
    };

    const media = window.matchMedia("(min-width: 768px)");
    pick();
    media.addEventListener("change", pick);
    return () => media.removeEventListener("change", pick);
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={POSTER_SRC}
      src={MOBILE_SRC}
      className="hero-video h-full w-full bg-[#020617] object-cover"
      aria-hidden="true"
      onError={(event) => {
        const video = event.currentTarget;
        if (video.dataset.fallback === "1") return;
        video.dataset.fallback = "1";
        video.src = FALLBACK_SRC;
        video.load();
        void video.play().catch(() => {});
      }}
    />
  );
}

export const HeroReel = memo(HeroReelInner, () => true);