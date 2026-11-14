import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

type PipelineFormCtaProps = {
  title: string;
  buttonLabel: string;
  trackingLabel: string;
  variant?: "dark" | "light";
};

export function PipelineFormCta({
  title,
  buttonLabel,
  trackingLabel,
  variant = "dark",
}: PipelineFormCtaProps) {
  return (
    <div className={`pipeline-inline-cta pipeline-inline-cta-${variant}`}>
      <div>
        <h3>{title}</h3>
      </div>
      <MetaTrackedLink href="#audit" trackingLabel={trackingLabel} className="pipeline-inline-cta-button discovery-cta">
        <span className="discovery-cta-copy">{buttonLabel}</span>
        <ArrowRight size={17} aria-hidden="true" />
      </MetaTrackedLink>
    </div>
  );
}
