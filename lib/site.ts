export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteName = "Arcanium Digital";

export const siteDescription =
  "Your first on-site appraisal booked in 7 days and 3 more within the month, or you don't pay. Book a free 10-minute discovery call and receive a complimentary Seller Appraisal Growth Guide.";
