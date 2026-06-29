export const faqs = [
  {
    question: "What is an Agent Site?",
    answer:
      "An Agent Site is a personalised website for a real estate agent. It is built to showcase their brand, recent sales, testimonials, suburb expertise, property marketing, and seller enquiry tools.",
  },
  {
    question: "How is this different from an agency profile page?",
    answer:
      "An agency profile page usually acts like a directory listing. An Agent Site is a focused conversion funnel that builds trust, proves local authority, and gives sellers clear reasons to request an appraisal or listing conversation.",
  },
  {
    question: "Can this help with SEO?",
    answer:
      "Yes. The structure supports local SEO with suburb-focused pages, helpful seller content, clear metadata, internal links, fast mobile performance, and search-intent copy around appraisals and listing advice.",
  },
  {
    question: "What lead tools can the site include?",
    answer:
      "Common tools include appraisal requests, home value checks, listing consultation forms, downloadable seller guides, property marketing review prompts, and direct calendar bookings.",
  },
  {
    question: "Who is this best for?",
    answer:
      "Arcanium Digital's agent sites are best for real estate agents who want to look more professional online, attract local sellers, prove expertise in specific suburbs, and convert more visitors into booked seller conversations.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Questions before
            <br />
            <span className="text-muted-foreground">you rebuild.</span>
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            Clear answers for agents deciding whether a personal website can become a serious source of seller conversations.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="divide-y divide-foreground/10 border-y border-foreground/10">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group py-6" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left">
                  <h3 className="text-xl font-medium">{faq.question}</h3>
                  <span className="grid size-8 shrink-0 place-items-center border border-foreground/15 text-lg transition-colors group-open:bg-foreground group-open:text-background">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
