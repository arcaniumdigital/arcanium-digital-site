export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteName = "Arcanium Digital";

export const siteDescription =
  "Get Arcanium Digital’s free 8-page Seller Appraisal Growth Guide and free 10–15-minute strategy call for generating, nurturing and converting more seller enquiries.";
