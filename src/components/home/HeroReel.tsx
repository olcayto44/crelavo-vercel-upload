"use client";

import { memo, useRef } from "react";

const PLAYLIST = [
  "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4"
];

function HeroReelInner() {
  const i = useRef(0);
  return (
    <video
      autoPlay
      muted
      playsInline
      preload="auto"
      src={PLAYLIST[0]}
      className="h-full w-full bg-[#020617] object-cover"
      onEnded={(event) => {
        const list = PLAYLIST.filter(Boolean);
        const video = event.currentTarget;
        if (list.length < 2) {
          video.currentTime = 0;
          video.muted = true;
          void video.play().catch(() => {});
          return;
        }
        i.current = (i.current + 1) % list.length;
        video.src = list[i.current];
        video.muted = true;
        void video.play().catch(() => {});
      }}
      onError={(event) => {
        const video = event.currentTarget;
        const list = PLAYLIST.filter(Boolean);
        if (list.length < 2) return;
        i.current = (i.current + 1) % list.length;
        video.src = list[i.current];
        video.muted = true;
        void video.play().catch(() => {});
      }}
    />
  );
}

export const HeroReel = memo(HeroReelInner, () => true);
