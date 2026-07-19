import { HardReloadLink } from "@/components/HardReloadLink";

export type HomeShowcaseSlide = {
  title: string;
  kicker: string;
  description: string;
  href: string;
  tone: "cyan" | "purple" | "green" | "amber" | "pink" | "blue";
  imageUrl?: string;
};

export function HomeShowcaseSlider({ title, subtitle, slides, reverse = false, headingLevel = "h2" }: { title: string; subtitle: string; slides: HomeShowcaseSlide[]; reverse?: boolean; headingLevel?: "h2" | "h3" }) {
  const loopSlides = [
    ...slides.map((slide) => ({ slide, duplicate: false })),
    ...slides.map((slide) => ({ slide, duplicate: true }))
  ];
  const Heading = headingLevel;

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
