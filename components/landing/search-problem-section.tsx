import { Search } from "lucide-react";

const searches = [
  "Best real estate agent in {suburb}",
  "Who should I use to sell my house in {suburb}?",
  "What is my property worth in {suburb}?",
];

export function SearchProblemSection() {
  return (
    <section className="relative overflow-visible bg-[#08090c] px-5 py-[88px] text-[#f5f5f3] [content-visibility:auto] [contain-intrinsic-size:auto_1200px] sm:px-6 md:px-8 lg:px-12 lg:py-40">
      <div className="pointer-events-none absolute -right-56 top-20 size-[620px] rounded-full bg-[#8f33ff]/7 blur-[160px]" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-40">
              <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#aaaab2]"><span className="size-1.5 rounded-full bg-[#8f33ff]" />The search is already happening</p>
              <h2 className="mt-5 max-w-[620px] font-display text-[clamp(2.125rem,9.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.04em] lg:text-[clamp(3rem,4vw,4.25rem)]">
              Your Next Vendor Could Already Be Searching
              </h2>
              <p className="mt-5 max-w-[590px] text-base font-medium leading-[1.65] text-[#aaaab2] lg:mt-6 lg:text-lg">
                Every month, local vendors search for the agent, advice and proof that will make their next move feel safer.
              </p>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-6 lg:col-start-7 lg:space-y-[18px]">
            {searches.map((query, index) => (
              <div key={query} className={`group relative flex min-h-[104px] items-center gap-4 rounded-[18px] border bg-[#121318] p-5 transition duration-500 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#18191f] lg:min-h-[120px] lg:px-8 ${index === 1 ? "border-[#8f33ff]/20 shadow-[inset_0_0_50px_rgba(143,51,255,0.035)]" : "border-white/9"}`}>
                <div className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-white/10 text-[#aaaab2]">
                  <Search className="size-4.5" aria-hidden="true" />
                </div>
                <p className="font-display text-[1.08rem] font-medium leading-snug tracking-[-0.025em] text-[#f5f5f3] sm:text-xl lg:text-[clamp(1.35rem,2vw,1.65rem)]">“{query}”</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-white/9 pt-10 lg:mt-28 lg:pt-16">
            <p className="max-w-[760px] text-base font-medium leading-[1.7] text-[#aaaab2] lg:text-lg">
              Increasingly, they’re asking the same questions through ChatGPT and other AI platforms. If your competitors appear across these searches and you don’t, they’re being considered for the listing before you even know the vendor exists.
            </p>
            <p className="mt-10 max-w-[900px] font-display text-[clamp(1.9rem,8vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.04em] lg:mt-14 lg:text-[clamp(2.125rem,3vw,3.125rem)]">You can’t win a listing you were never considered for.</p>
            <p className="mt-5 max-w-[760px] text-base font-medium leading-[1.7] text-[#aaaab2] lg:mt-7 lg:text-lg">
              And when one listing can be worth <strong className="whitespace-nowrap font-extrabold text-[#c998ff]">$15,000–$30,000+</strong> in commission, being invisible gets expensive quickly.
            </p>
        </div>
      </div>
    </section>
  );
}
