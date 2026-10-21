import { randomUUID } from "node:crypto";
import { isApprovedDemoRecipient, isDemoRequestOrigin, validateDemoSmsLead } from "../../../lib/seller-demo-sms";
import { startOwnerSmsDemo } from "../../../lib/seller-demo-delivery";
import { startPublicSmsDemo } from "../../../lib/seller-demo-public-delivery";
import { checkBotId } from "botid/server";

export const preferredRegion = "syd1";
export const maxDuration = 40;

function reply(status: number, code: string, message: string, requestId: string) {
  return Response.json({ accepted: false, state: "BLOCKED", code, message, requestId }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  if (!isDemoRequestOrigin(request.headers.get("origin"), request.url, process.env.NODE_ENV === "development")) return reply(403, "ORIGIN_NOT_ALLOWED", "Open the demo page and try again. No SMS was sent.", requestId);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415, "INVALID_CONTENT_TYPE", "Use the demo form. No SMS was sent.", requestId);
  if (Number(request.headers.get("content-length")) > 8192) return reply(413, "PAYLOAD_TOO_LARGE", "Your request is too large. No SMS was sent.", requestId);
  let value: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8192) return reply(413, "PAYLOAD_TOO_LARGE", "Your request is too large. No SMS was sent.", requestId);
    value = JSON.parse(raw);
  } catch {
    return reply(400, "INVALID_JSON", "Check the form and try again. No SMS was sent.", requestId);
  }
  let lead;
  try { lead = validateDemoSmsLead(value); }
  catch (cause) { return reply(400, "INVALID_DEMO_DETAILS", cause instanceof Error ? cause.message : "Check your demo details.", requestId); }

  if (process.env.SELLER_DEMO_MODE === "public") {
    // No public SMS effect without the platform's browser-side and server-side
    // bot verification. Errors fail closed, never bypass protection.
    try {
      if ((await checkBotId({ advancedOptions: { checkLevel: "basic" } })).isBot) return reply(403, "BROWSER_CHECK_FAILED", "The browser check failed. Open the demo page in your browser. No SMS was sent.", requestId);
    } catch {
      return reply(503, "BROWSER_CHECK_UNAVAILABLE", "The browser check is unavailable. Try again later. No SMS was sent.", requestId);
    }
    const result = await startPublicSmsDemo(lead, {
      token: process.env.SELLER_DEMO_GHL_TOKEN,
      isolationVerified: process.env.SELLER_DEMO_SMS_ISOLATION,
    }, requestId);
    console.info("seller_demo_result", { requestId, code: result.code, state: result.state });
    const { status, ...body } = result;
    return Response.json({ ...body, requestId }, { status, headers: { "Cache-Control": "no-store" } });
  }

  if (!process.env.SELLER_DEMO_TEST_PHONE) return reply(503, "TEST_RECIPIENT_NOT_CONFIGURED", "The approved SMS test destination is not configured. No SMS was sent.", requestId);
  if (!isApprovedDemoRecipient(lead.phone, process.env.SELLER_DEMO_TEST_PHONE)) return reply(403, "RECIPIENT_NOT_ALLOWED", "SMS testing is restricted to the owner's approved mobile. No SMS was sent.", requestId);

  const result = await startOwnerSmsDemo(lead, {
    token: process.env.SELLER_DEMO_GHL_TOKEN,
    approvedPhone: process.env.SELLER_DEMO_TEST_PHONE,
    isolationVerified: process.env.SELLER_DEMO_SMS_ISOLATION,
  });
  console.info("seller_demo_result", { requestId, code: result.code, state: result.state });
  const { status, ...body } = result;
  return Response.json({ ...body, requestId }, { status, headers: { "Cache-Control": "no-store" } });
}
