export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteName = "Arcanium Digital";

export const siteDescription =
  "Arcanium Digital helps real estate agents reach local vendors through done-for-you Google Ads, stronger online visibility and a clearer path from search to enquiry.";
