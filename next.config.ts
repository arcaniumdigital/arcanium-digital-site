import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [70, 74, 75, 76, 78],
  },
  async redirects() {
    return [
      {
        source: "/vendor-audit",
        destination: "/vendor-lead-opportunity",
        permanent: false,
      },
      {
        source: "/brochure",
        destination:
          "https://drive.google.com/file/d/1QUNs7vVdi42qfHBJJcXJ9Hoty6fwGN9f/view?usp=sharing",
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "arcaniumdigital",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
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
