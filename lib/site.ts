export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteName = "More Vendors";

export const siteDescription =
  "We generate local seller enquiries through Meta Ads, follow up with AI and book ready homeowners directly into your calendar. See if you qualify.";
