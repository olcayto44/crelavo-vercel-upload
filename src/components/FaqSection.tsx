import { getConfiguredFaqItems } from "@/lib/faq-config";

export async function FaqSection() {
  const faqs = await getConfiguredFaqItems();

  return (
    <section id="faq" className="container section home-section-tight clean-feed-section faq-section">
      <div className="sample-video-head">
        <div>
          <span className="badge">Frequently Asked Questions</span>
          <h2>Most asked questions about Crelavo</h2>
          <p className="section-lead">Essential answers about production, credits, delivery, tools and admin management. These contents can be updated from the admin panel.</p>
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
