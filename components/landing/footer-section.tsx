import { ArrowRight, ArrowUpRight } from "lucide-react";

const footerLinks = [
  { name: "Video breakdown", href: "#vsl" },
  { name: "Example site", href: "#showcase" },
  { name: "Reviews", href: "#testimonials" },
  { name: "Analytics", href: "#analytics" },
];

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/arcaniumdigital/" },
  { name: "Facebook", href: "https://www.facebook.com/arcaniumdigital/" },
];

export function FooterSection() {
  return (
    <footer className="relative bg-black text-white">
      <div className="relative h-[260px] overflow-hidden md:h-[340px]">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2810%29-UnDKstODkIENp5xqTYUEpt0Sm8tNOw.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/45" />
      </div>

      <div className="relative z-10 mx-auto -mt-12 max-w-[1400px] px-6 pb-10 lg:px-12">
        <div className="border-t border-white/10 pt-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto] md:items-start md:gap-10">
            <div className="col-span-2 md:col-span-1">
              <a href="#" className="font-display text-2xl">
                Arcanium Digital
              </a>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
                Personalised agent sites built to make local proof easier to trust, click, and act on.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium text-white">Explore</h3>
              <ul className="space-y-3">
                {footerLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-white/45 transition-colors hover:text-white">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium text-white">Social</h3>
              <ul className="space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1 text-sm text-white/45 transition-colors hover:text-white"
                    >
                      {link.name}
                      <ArrowUpRight className="size-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#cta"
              className="group col-span-2 inline-flex h-12 w-fit items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90 md:col-span-1"
            >
              Make me more money
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Arcanium Digital. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-white/70">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white/70">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
