"use client";

import { useState } from "react";
import { HardReloadLink } from "@/components/HardReloadLink";

export type HomeShowcaseSlide = {
  title: string;
  kicker: string;
  description: string;
  href: string;
  tone: "cyan" | "purple" | "green" | "amber" | "pink" | "blue";
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
};

export function HomeShowcaseSlider({ title, subtitle, slides, reverse = false, headingLevel = "h2" }: { title: string; subtitle: string; slides: HomeShowcaseSlide[]; reverse?: boolean; headingLevel?: "h2" | "h3" }) {
  const [activeVideo, setActiveVideo] = useState<HomeShowcaseSlide | null>(null);
  const hasVideoSlides = slides.some((slide) => Boolean(slide.videoUrl));
  const loopSlides = [
    ...slides.map((slide) => ({ slide, duplicate: false })),
    ...slides.map((slide) => ({ slide, duplicate: true }))
  ];
  const Heading = headingLevel;

  if (hasVideoSlides) {
    return (
      <section className="container section home-section-tight clean-feed-section showcase-slider-section">
        <div className="showcase-slider-head">
          <div>
            <span className="badge">Showcase</span>
            <Heading>{title}</Heading>
            <p className="section-lead">{subtitle}</p>
          </div>
        </div>
        <div className="showcase-video-grid">
          {slides.map((slide, index) => (
            <article
              className={`showcase-video-card tone-${slide.tone}`}
              key={slide.title}
              onMouseEnter={(event) => {
                const video = event.currentTarget.querySelector("video");
                void video?.play().catch(() => undefined);
              }}
              onMouseLeave={(event) => {
                const video = event.currentTarget.querySelector("video");
                video?.pause();
              }}
              onFocus={(event) => {
                const video = event.currentTarget.querySelector("video");
                void video?.play().catch(() => undefined);
              }}
              onBlur={(event) => {
                const video = event.currentTarget.querySelector("video");
                video?.pause();
              }}
            >
              {slide.videoUrl ? (
                <video
                  className="showcase-video-player"
                  src={slide.videoUrl}
                  poster={slide.posterUrl}
                  controls
                  muted
                  loop
                  playsInline
                  preload={index === 0 ? "auto" : "metadata"}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  aria-label={`Crelavo ${slide.kicker} showcase video for ${slide.title}`}
                />
              ) : slide.imageUrl ? (
                <img
                  className="showcase-video-player"
                  src={slide.imageUrl}
                  alt={`Crelavo ${slide.kicker} showcase preview for ${slide.title}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
              ) : (
                <div className="showcase-video-player showcase-art-fallback" aria-hidden="true" />
              )}
              <div className="showcase-video-copy">
                <span>{slide.kicker}</span>
                <strong>{slide.title}</strong>
                <p>{slide.description}</p>
                <div className="showcase-video-actions">
                  {slide.videoUrl ? (
                    <button
                      className="showcase-slide-cta"
                      type="button"
                      onClick={(event) => {
                        const card = event.currentTarget.closest("article");
                        const video = card?.querySelector("video");
                        video?.pause();
                        setActiveVideo(slide);
                      }}
                    >
                      Watch full screen
                    </button>
                  ) : null}
                  <HardReloadLink className="showcase-slide-link" href={slide.href}>
                    Open category
                  </HardReloadLink>
                </div>
              </div>
            </article>
          ))}
        </div>
        {activeVideo?.videoUrl ? (
          <div className="showcase-video-modal" role="dialog" aria-modal="true" aria-label={`${activeVideo.title} fullscreen video`}>
            <button className="showcase-video-modal-backdrop" type="button" aria-label="Close video" onClick={() => setActiveVideo(null)} />
            <div className="showcase-video-modal-panel">
              <div className="showcase-video-modal-head">
                <div>
                  <span>{activeVideo.kicker}</span>
                  <strong>{activeVideo.title}</strong>
                </div>
                <button className="showcase-video-modal-close" type="button" onClick={() => setActiveVideo(null)}>
                  Close
                </button>
              </div>
              <video
                className="showcase-video-modal-player"
                src={activeVideo.videoUrl}
                poster={activeVideo.posterUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
              />
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="container section home-section-tight clean-feed-section showcase-slider-section">
      <div className="showcase-slider-head">
        <div>
          <span className="badge">Showcase</span>
          <Heading>{title}</Heading>
          <p className="section-lead">{subtitle}</p>
        </div>
      </div>
      <div className={`showcase-slider-track-wrap ${reverse ? "reverse" : ""}`}>
        <div className="showcase-slider-track">
          {loopSlides.map(({ slide, duplicate }, index) => {
            const content = (
              <>
                {slide.imageUrl ? (
                  <img
                    className="showcase-art-image"
                    src={slide.imageUrl}
                    alt={duplicate ? "" : `Crelavo ${slide.kicker} showcase preview for ${slide.title}`}
                    loading={index < 2 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                ) : <div className="showcase-art-fallback" aria-hidden="true" />}
                <div className="showcase-art-overlay" aria-hidden="true" />
                {duplicate ? (
                  <>
                    <span className="showcase-copy-text" data-text={slide.kicker} aria-hidden="true" />
                    <strong className="showcase-copy-text" data-text={slide.title} aria-hidden="true" />
                    <p className="showcase-copy-text" data-text={slide.description} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>{slide.kicker}</span>
                    <strong>{slide.title}</strong>
                    <p>{slide.description}</p>
                  </>
                )}
              </>
            );

            return duplicate ? (
              <div className={`showcase-slide-card tone-${slide.tone}`} key={`${slide.title}-${index}`} aria-hidden="true">
                {content}
              </div>
            ) : (
              <HardReloadLink className={`showcase-slide-card tone-${slide.tone}`} href={slide.href} key={`${slide.title}-${index}`}>
                {content}
              </HardReloadLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
