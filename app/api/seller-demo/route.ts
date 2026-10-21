import { randomUUID } from "node:crypto";
import { isApprovedDemoRecipient, isDemoRequestOrigin, validateDemoSmsLead } from "../../../lib/seller-demo-sms";

export const preferredRegion = "syd1";

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

  if (!process.env.SELLER_DEMO_TEST_PHONE) return reply(503, "TEST_RECIPIENT_NOT_CONFIGURED", "The approved SMS test destination is not configured. No SMS was sent.", requestId);
  if (!isApprovedDemoRecipient(lead.phone, process.env.SELLER_DEMO_TEST_PHONE)) return reply(403, "RECIPIENT_NOT_ALLOWED", "SMS testing is restricted to the owner's approved mobile. No SMS was sent.", requestId);

  // GHL's Arcanium Phone System was inspected on 2026-10-21: no numbers.
  // Fail closed even if the allowlist is configured. No contact creation,
  // workflow enrollment, provider request or retry can occur in this state.
  // A verified two-way Arcanium sender and isolated delivery path are release gates.
  console.info("seller_demo_blocked", { requestId, code: "SMS_SENDER_NOT_CONNECTED" });
  return reply(503, "SMS_SENDER_NOT_CONNECTED", "Arcanium's SMS number is not connected yet. No SMS was sent. You can still try the website conversation below.", requestId);
}
