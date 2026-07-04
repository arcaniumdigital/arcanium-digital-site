import { ArrowUpRight } from "lucide-react";

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/arcaniumdigital/" },
  { name: "Facebook", href: "https://www.facebook.com/arcaniumdigital/" },
];

export function FooterSection() {
  return (
    <footer className="border-t border-black/10 bg-white px-5 py-10 text-[#111114] sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <a href="#" className="inline-flex items-center gap-2 font-display text-xl font-black">
              <span className="grid size-8 place-items-center rounded-full bg-[#8f33ff] text-xs text-white">
                AD
              </span>
              Arcanium Digital
            </a>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-[#111114]/48">
              Disclaimer: Arcanium Digital provides website, funnel, and marketing strategy support. Results vary based on your offer, market, follow-up, content, and implementation. No specific appraisal, listing, or revenue outcome is guaranteed.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-[#f6f4f8] px-4 text-sm font-bold text-[#111114]/70 transition-colors hover:border-[#8f33ff]/35 hover:text-[#8f33ff]"
              >
                {link.name}
                <ArrowUpRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-6 text-sm font-medium text-[#111114]/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Arcanium Digital. All rights reserved.</p>
          <a href="#cta" className="w-fit transition-colors hover:text-[#8f33ff]">
            Book your appraisal growth plan
          </a>
        </div>
      </div>
    </footer>
  );
}
