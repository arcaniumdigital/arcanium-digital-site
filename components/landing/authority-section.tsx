import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "The new site makes me look like the local specialist I already was. Sellers can see my recent results, reviews, and appraisal offer without hunting through three different platforms.",
    name: "Amelia Hart",
    role: "Lead agent",
    market: "Bayside Melbourne",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    quote:
      "It turned my social traffic into something useful. Instead of sending people to a generic profile, I now have a page that explains my process and captures appraisal enquiries properly.",
    name: "Daniel Cross",
    role: "Principal agent",
    market: "Gold Coast",
  },
  {
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "The suburb pages are the part I like most. They let me speak directly to sellers in the areas I want more listings from, with proof that feels specific to them.",
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
              Authority and trust
            </span>
            <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Sample client proof
              <br />
              <span className="text-muted-foreground">for the trust section.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-5">
            Replace these samples with real agent wins as soon as they are ready, so the page can prove the outcome before asking for the call.
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
