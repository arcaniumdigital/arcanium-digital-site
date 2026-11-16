import Script from "next/script";

const caseStudyEmbed = {
  __html: '<wistia-player media-id="kqe6f7pd85" aspect="1.7777777777777777" player-color="#8f33ff" poster="https://www.morevendors.com/images/seller-pipeline/kael-sharp-case-study.png"></wistia-player>',
};

export function CaseStudyVideo() {
  return <div className="mv-case-study-video">
    <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
    <Script src="https://fast.wistia.com/embed/kqe6f7pd85.js" type="module" strategy="afterInteractive" />
    <div className="mv-case-study-embed" dangerouslySetInnerHTML={caseStudyEmbed} />
  </div>;
}

export function CaseStudySection() {
  return <section id="case-study" className="mv-section mv-shell"><h2>Case Study</h2><CaseStudyVideo /></section>;
}
