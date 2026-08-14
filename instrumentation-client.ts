import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  enableLogs: true,
  beforeSend(event) {
    const exceptions = event.exception?.values ?? [];
    const errorText = [
      event.message,
      ...exceptions.map((exception) => exception.value),
    ]
      .filter(Boolean)
      .join(" ");
    const isKnownMetaWebViewError =
      errorText.includes("window.webkit.messageHandlers") ||
      errorText.includes("Error invoking postMessage: Java object is gone");
    const hasInjectedAppFrame = exceptions.some((exception) =>
      exception.stacktrace?.frames?.some(
        (frame) =>
          frame.filename?.startsWith("app://") ||
          frame.abs_path?.startsWith("app://")
      )
    );

    return isKnownMetaWebViewError && hasInjectedAppFrame ? null : event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
