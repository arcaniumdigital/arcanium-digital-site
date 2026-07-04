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
      "I was hesitant because I was not ready for more social exposure. Once I decided to move forward, the process felt considered and professional, and I have not regretted it.",
    name: "Shana",
    role: "Real estate agent",
    market: "Premium property",
  },
  {
    avatar: "/images/testimonials/dave-mcloughlin.avif",
    quote:
      "Jordan is a driven young professional who genuinely looks for ways to create value. He listens carefully, brings practical ideas, and stays focused on outcomes.",
    name: "Dave McLoughlin",
    role: "Property professional",
    market: "Sunshine Coast",
  },
];

export function AuthoritySection() {
  return (
    <section id="testimonials" className="relative overflow-hidden bg-[#f6f4f8] px-5 py-20 sm:px-6 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[980px]">
        <h2 className="mb-9 text-center font-display text-[clamp(2.35rem,5vw,4.7rem)] font-black leading-[0.92] tracking-tight text-[#111114]">
          Client proof
        </h2>

        <div className="space-y-5">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_18px_50px_rgba(63,32,94,0.08)]">
              <div className="bg-[#8f33ff] px-5 py-3 text-center text-sm font-black text-white">
                {testimonial.name} / {testimonial.market}
              </div>
              <div className="p-6 sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <Quote className="size-6 text-[#8f33ff]" />
                  <div className="flex gap-1 text-[#8f33ff]">
                    {[...Array(5)].map((_, index) => (
                      <Star key={index} className="size-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-lg font-medium leading-relaxed text-[#111114]/74">"{testimonial.quote}"</p>
                <div className="mt-6 flex items-center gap-4 border-t border-black/10 pt-5">
                  <img
                    src={testimonial.avatar}
                    alt=""
                    aria-hidden="true"
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-display text-2xl font-bold leading-none text-[#111114]">{testimonial.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[#111114]/50">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
