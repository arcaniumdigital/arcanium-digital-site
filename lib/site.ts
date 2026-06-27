export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteName = "Arcanium Digital";

export const siteDescription =
  "Arcanium Digital builds personalised websites for real estate agents that create trust, showcase proof, and turn visitors into booked seller conversations.";
