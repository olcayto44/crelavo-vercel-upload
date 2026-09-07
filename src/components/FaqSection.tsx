import { publicProFaqs } from "@/lib/public-pro-faq";

export async function FaqSection() {
  const faqs = publicProFaqs;

  return (
    <section id="faq" className="container section home-section-tight clean-feed-section faq-section">
      <div className="sample-video-head">
        <div>
          <span className="badge">Frequently Asked Questions</span>
          <h2>Most asked questions about the Crelavo Pro trial</h2>
          <p className="section-lead">Essential answers about the Pro 24-hour trial, card requirement, cancellation and Whop billing.</p>
        </div>
      </div>
      <div className="faq-grid">
        {faqs.map((item) => (
          <article className="faq-card" key={item.id}>
            <div className="faq-card-question">
              <span>{item.category}</span>
              <strong>{item.question}</strong>
            </div>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
