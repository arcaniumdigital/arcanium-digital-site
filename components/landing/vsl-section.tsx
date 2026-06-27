import Script from "next/script";

export function VslSection() {
  return (
    <section id="vsl" className="relative overflow-hidden bg-background py-20 lg:py-28">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src="https://fast.wistia.com/embed/e6p2cj6s1v.js"
        strategy="afterInteractive"
        type="module"
      />
      <style>{`
        wistia-player[media-id='e6p2cj6s1v'] {
          display: block;
          width: 100%;
        }

        wistia-player[media-id='e6p2cj6s1v']:not(:defined) {
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/e6p2cj6s1v/swatch');
          display: block;
          filter: blur(5px);
          padding-top: 75%;
        }
      `}</style>

      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 lg:grid-cols-12 lg:items-center lg:px-12">
        <div className="lg:col-span-4">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <span className="h-px w-10 bg-foreground/30" />
            01 / Video sales letter
          </span>
          <h2 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            See the appraisal
            <br />
            <span className="text-muted-foreground">growth system.</span>
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Watch how a personal agent site can package your proof, answer seller doubt, and give people a clear reason to book with you.
          </p>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden border border-foreground/15 bg-black shadow-2xl shadow-black/30">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  '<wistia-player media-id="e6p2cj6s1v" wistia-popover="true" aspect="1.3333333333333333"></wistia-player>',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
