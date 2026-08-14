"use client";

type MetaEventParameters = Record<string, string | number | boolean>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  eventName: string,
  parameters?: MetaEventParameters
) {
  window.fbq?.("track", eventName, parameters);
}

export function trackMetaCustomEvent(
  eventName: string,
  parameters?: MetaEventParameters
) {
  window.fbq?.("trackCustom", eventName, parameters);
}
