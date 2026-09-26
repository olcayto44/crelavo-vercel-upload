"use client";

import { memo, useEffect, useRef } from "react";

const DESKTOP_SRC = "/hero/hero-04-giant-fashion-city-1920x1080.mp4";
const MOBILE_SRC = "/hero/hero-04-giant-fashion-city-1080x1920.mp4";
const POSTER_SRC = "/hero/hero-04-giant-fashion-city-poster.png";

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
      src={DESKTOP_SRC}
      className="hero-video h-full w-full bg-[#020617] object-cover"
      aria-hidden="true"
    />
  );
}

export const HeroReel = memo(HeroReelInner, () => true);