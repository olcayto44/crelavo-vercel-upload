"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ShowcaseFilm = {
  href: string;
  kicker: string;
  title: string;
  poster?: string;
  video: string;
  landscape: boolean;
};

const WINDOW_SIZE = 25;
const ROTATION_STEP = 4;
const ROTATION_INTERVAL_MS = 12_000;

function ShowcaseFilmCard({ film, eager }: { film: ShowcaseFilm; eager: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const play = () => {
      const result = video.play();
      if (result) result.catch(() => undefined);
    };

    if (!("IntersectionObserver" in window)) {
      play();
      return () => video.pause();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play();
        else video.pause();
      },
      { threshold: 0.2, rootMargin: "120px 0px" }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  const className = film.href.endsWith("/lower-ad-costs-showcase")
    ? "film still"
    : film.landscape
      ? "film ls"
      : "film";

  return (
    <a className={className} href={film.href}>
      <video ref={videoRef} muted loop playsInline autoPlay={eager} preload={eager ? "metadata" : "none"} poster={film.poster} src={film.video} />
      <span className="meta"><small>{film.kicker}</small><h3>{film.title}</h3></span>
    </a>
  );
}

export function HomeShowcaseGrid({ films }: { films: ShowcaseFilm[] }) {
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (films.length <= WINDOW_SIZE) return;
    const timer = window.setInterval(() => {
      setStartIndex((current) => (current + ROTATION_STEP) % films.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [films.length]);

  const visibleFilms = useMemo(() => {
    const count = Math.min(WINDOW_SIZE, films.length);
    return Array.from({ length: count }, (_, index) => films[(startIndex + index) % films.length]);
  }, [films, startIndex]);

  return <div className="films">{visibleFilms.map((film, index) => <ShowcaseFilmCard film={film} eager={index < 4} key={film.href} />)}</div>;
}
