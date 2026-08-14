import { Quote } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    avatar: "/images/testimonials/mary-ann-mcloughlin.jpg",
    quote: "The site feels premium without feeling complicated. Potential vendors can quickly understand who I help, what I have sold, and how to start the right conversation with me.",
    name: "Mary-Ann McLoughlin",
    role: "Real estate agent",
    market: "Sunshine Coast",
  },
  {
    avatar: "/images/testimonials/shana.jpg",
    quote: "I was hesitant because I was not ready for more social exposure. Once I decided to move forward, the process felt considered and professional, and I have not regretted it.",
    name: "Shana",
    role: "Real estate agent",
    market: "Brisbane",
  },
  {
    avatar: "/images/testimonials/kael-sharp.jpg",
    quote: "Jordan is a driven young professional who genuinely looks for ways to create value. He listens carefully, brings practical ideas, and stays focused on outcomes.",
    name: "Kael Sharp",
    role: "Estate Agent",
    market: "Sydney",
  },
];

export function AuthoritySection() {
  return (
    <section id="testimonials" className="relative overflow-hidden bg-[#08090c] px-4 py-[88px] text-[#f5f5f3] [content-visibility:auto] [contain-intrinsic-size:auto_1100px] sm:px-6 md:px-8 lg:px-12 lg:py-40">
      <div className="pointer-events-none absolute -right-56 top-0 size-[600px] rounded-full bg-[#8f33ff]/6 blur-[160px]" />
      <div className="relative mx-auto max-w-[1280px]">
        <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#aaaab2]"><span className="size-1.5 rounded-full bg-[#8f33ff]" />Trusted by local agents</p>
        <h2 className="mb-12 mt-5 font-display text-[clamp(2.125rem,9.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.04em] lg:mb-16 lg:text-[clamp(3rem,4vw,3.75rem)]">Client testimonials</h2>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <article key={testimonial.name} className={`group relative flex flex-col overflow-hidden rounded-[20px] border border-white/9 bg-[#121318] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 lg:rounded-[24px] ${index === 0 ? "lg:col-span-7 lg:row-span-2 lg:p-12" : "lg:col-span-5 lg:p-8"}`}>
                <Quote className="absolute right-5 top-3 size-24 text-white/[0.035] lg:size-36" aria-hidden="true" />
                <p className="relative text-xs font-semibold uppercase tracking-[0.08em] text-[#aaaab2]">{testimonial.name} / {testimonial.market}</p>
                <p className={`relative mt-7 font-display font-medium leading-[1.48] tracking-[-0.025em] text-[#f5f5f3] ${index === 0 ? "text-xl lg:text-[1.7rem]" : "text-lg lg:text-xl"}`}>“{testimonial.quote}”</p>
                <div className={`relative mt-8 flex items-center gap-4 border-t border-white/9 pt-5 ${index === 0 ? "lg:mt-auto" : ""}`}>
                  {testimonial.avatar ? (
                    <Image src={testimonial.avatar} alt="" width={64} height={64} sizes={index === 0 ? "64px" : "48px"} quality={74} className={`rounded-full object-cover ${index === 0 ? "size-12 lg:size-16" : "size-12"}`} />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full border border-white/10 bg-[#18191f] font-display text-sm font-semibold text-white">KS</div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-semibold leading-none tracking-[-0.025em] text-[#f5f5f3]">{testimonial.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[#777881]">{testimonial.role}</p>
                  </div>
                </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
