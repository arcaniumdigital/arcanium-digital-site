"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { trackMetaCustomEvent } from "@/lib/meta-pixel";

interface MetaTrackedLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  trackingLabel: string;
}

export function MetaTrackedLink({
  trackingLabel,
  href,
  onClick,
  ...props
}: MetaTrackedLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackMetaCustomEvent("ButtonClick", {
      button_name: trackingLabel,
      destination: href ?? "",
    });
    onClick?.(event);

    // Meta's automatic history tracking treats hash-only navigation as a new
    // PageView. Scroll in place so CTA clicks do not inflate page-view totals.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      typeof href !== "string" ||
      !href.startsWith("#")
    ) {
      return;
    }

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <a {...props} href={href} onClick={handleClick} />;
}
