import { handleBookingBrowserEvent, handleCalWebhook } from "./booking";
import { handleClickSendInbound, handleClickSendReceipt } from "./clicksend";
import { corsHeaders, json, routeNotFound } from "./http";
import { handleContext, handleIntake } from "./intake";
import { handleDueMessage, handleInngestHeartbeat, handleOperatorReport } from "./internal";
import { handleHealth, handleScheduled } from "./monitoring";
import { handleQueue } from "./queue";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname === "/api/vendor-audit") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === "OPTIONS" && url.pathname === "/events/booking") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === "POST" && url.pathname === "/api/vendor-audit") return handleIntake(request, env, ctx);
    if (request.method === "GET" && url.pathname === "/internal/booking-context") return handleContext(request, env);
    if (request.method === "POST" && url.pathname === "/internal/due-message") return handleDueMessage(request, env, ctx);
    if (request.method === "POST" && url.pathname === "/internal/inngest-heartbeat") return handleInngestHeartbeat(request, env);
    if (request.method === "GET" && url.pathname === "/internal/operator-report") return handleOperatorReport(request, env);
    if (request.method === "POST" && url.pathname === "/webhooks/cal/bookings") return handleCalWebhook(request, env, ctx);
    if (request.method === "POST" && url.pathname === "/events/booking") return handleBookingBrowserEvent(request, env);
    const receiptMatch = url.pathname.match(/^\/webhooks\/clicksend\/receipts\/([A-Za-z0-9_-]+)$/);
    if (request.method === "POST" && receiptMatch) return handleClickSendReceipt(request, env, receiptMatch[1]);
    const inboundMatch = url.pathname.match(/^\/webhooks\/clicksend\/inbound\/([A-Za-z0-9_-]+)$/);
    if (request.method === "POST" && inboundMatch) return handleClickSendInbound(request, env, ctx, inboundMatch[1]);
    const healthMatch = url.pathname.match(/^\/health\/funnel\/([A-Za-z0-9_-]+)$/);
    if (request.method === "GET" && healthMatch) return handleHealth(env, healthMatch[1]);
    if (request.method === "GET" && url.pathname === "/") return json({ service: "arcanium-funnel", status: "ok" });
    return routeNotFound();
  },
  queue: handleQueue,
  scheduled(controller: ScheduledController, env: Cloudflare.Env, ctx: ExecutionContext): void {
    ctx.waitUntil(handleScheduled(controller, env));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
