import { ArrowRight } from "lucide-react";
import { MetaTrackedLink } from "@/components/analytics/meta-tracked-link";

type PipelineFormCtaProps = {
  eyebrow: string;
  title: string;
  body: string;
  buttonLabel: string;
  trackingLabel: string;
  variant?: "dark" | "light";
};

export function PipelineFormCta({
  eyebrow,
  title,
  body,
  buttonLabel,
  trackingLabel,
  variant = "dark",
}: PipelineFormCtaProps) {
  return (
    <div className={`pipeline-inline-cta pipeline-inline-cta-${variant}`}>
      <div>
        <p className="pipeline-inline-cta-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <MetaTrackedLink href="#audit" trackingLabel={trackingLabel} className="pipeline-inline-cta-button">
        {buttonLabel}
        <ArrowRight size={17} aria-hidden="true" />
      </MetaTrackedLink>
    </div>
  );
}
