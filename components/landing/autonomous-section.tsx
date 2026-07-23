import { ArrowUpRight } from "lucide-react";

const showcaseImages = [
  {
    title: "Authority-first homepage",
    image: "/images/showcase/mary-ann.png",
    alt: "Mary-Ann McLoughlin real estate agent homepage example",
  },
  {
    title: "Premium vendor positioning",
    image: "/images/showcase/mary-ann-strategy.png",
    alt: "Mary-Ann McLoughlin website positioning section example",
  },
  {
    title: "Proof vendors can scan",
    image: "/images/showcase/mary-ann-results.png",
    alt: "Mary-Ann McLoughlin results and property proof section example",
  },
];

export function AutonomousSection() {
  return (
    <section id="showcase" className="relative overflow-hidden bg-white px-5 py-20 sm:px-6 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto mb-10 max-w-[780px] text-center">
          <h2 className="font-display text-[clamp(2.35rem,5vw,4.7rem)] font-black leading-[0.92] tracking-tight text-[#111114]">
            The proof vendors need before they pick up the phone.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-[#111114]/58 md:text-lg">
            When someone searches your name, they should quickly see local proof, recent results, and a clear reason to believe delaying the conversation could cost them.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {showcaseImages.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[18px] border border-black/10 bg-[#f6f4f8] shadow-[0_18px_50px_rgba(63,32,94,0.08)]">
              <div className="bg-[#8f33ff] px-4 py-3 text-center text-sm font-black text-white">
                {item.title}
              </div>
              <div className="bg-white p-2">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="aspect-[16/10] w-full rounded-[12px] object-contain object-top"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="https://maryannmcloughlin.com"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-bold text-[#111114] shadow-[0_12px_34px_rgba(63,32,94,0.08)] transition-colors hover:border-[#8f33ff]/35 hover:text-[#8f33ff]"
          >
            View the live example
            <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
