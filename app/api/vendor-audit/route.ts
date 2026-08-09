import { proxyToFunnel } from "@/lib/funnel-proxy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyToFunnel(request, "/api/vendor-audit");
}
