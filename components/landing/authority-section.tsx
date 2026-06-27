import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    avatar: "/images/testimonials/mary-ann-mcloughlin.jpg",
    quote:
      "The site feels premium without feeling complicated. Sellers can quickly understand who I help, what I have sold, and how to start the right conversation with me.",
    name: "Mary-Ann McLoughlin",
    role: "Real estate agent",
    market: "Sunshine Coast",
  },
  {
    avatar: "/images/testimonials/shana.jpg",
    quote:
      "Jordan mapped out a clear path for me to step up from $1M properties into the $2M bracket by sharpening my positioning and tightening the follow-up gaps that were costing deals.",
    name: "Shana",
    role: "Real estate agent",
    market: "Premium property",
  },
  {
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "It gives warm sellers one focused place to see my reviews, recent results, and local knowledge before they decide who to invite in.",
    name: "Mia Tan",
    role: "Sales consultant",
    market: "Brisbane West",
  },
];

export function AuthoritySection() {
  return (
    <section id="testimonials" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <span className="h-px w-10 bg-foreground/30" />
              Reviews and trust
            </span>
            <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Make sellers feel
              <br />
              <span className="text-muted-foreground">safe to enquire.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-5">
            The right proof lowers the risk of reaching out. Put reviews, recent results, and local confidence where sellers can see them before they book.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="border border-foreground/10 bg-foreground/[0.02] p-7">
              <div className="mb-8 flex items-center justify-between">
                <Quote className="size-6 text-[#eca8d6]" />
                <div className="flex gap-1 text-[#eca8d6]">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-lg leading-relaxed text-foreground/80">"{testimonial.quote}"</p>
              <div className="mt-8 flex items-center gap-4 border-t border-foreground/10 pt-5">
                <img
                  src={testimonial.avatar}
                  alt=""
                  aria-hidden="true"
                  className="size-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-display text-2xl">{testimonial.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {testimonial.role} / {testimonial.market}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
