import Script from "next/script";

export function VslSection() {
  return (
    <section id="vsl" className="relative overflow-hidden bg-background py-20 lg:py-28">
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src="https://fast.wistia.com/embed/43wdr7dw38.js"
        strategy="afterInteractive"
        type="module"
      />
      <style>{`
        .vsl-wistia-player wistia-player[media-id='43wdr7dw38'] {
          display: block;
          width: 100%;
        }

        .vsl-wistia-player wistia-player[media-id='43wdr7dw38']:not(:defined) {
          background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/43wdr7dw38/swatch');
          display: block;
          filter: blur(5px);
          padding-top: 75%;
        }
      `}</style>

      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 lg:grid-cols-12 lg:items-center lg:px-12">
        <div className="lg:col-span-4">
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
              className="vsl-wistia-player"
              dangerouslySetInnerHTML={{
                __html:
                  '<wistia-player media-id="43wdr7dw38" wistia-popover="true" aspect="1.3333333333333333"></wistia-player>',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
