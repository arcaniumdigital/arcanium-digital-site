import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  output: "export",
};

export default withSentryConfig(nextConfig, {
  org: "arcaniumdigital",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
