import { randomUUID } from "node:crypto";
import { checkBotId } from "botid/server";
import { isApprovedDemoRecipient, isDemoRequestOrigin } from "@/lib/seller-demo-sms";
import { buildRetellDemoCallBody, validateTestAiCallLead } from "@/lib/test-ai-call";

export const preferredRegion = "syd1";
export const maxDuration = 20;

const publicIsolation = "public-callback-v1";
const protectedNumbers = new Set(["+61435821736", "+61485064804"]);

function reply(status: number, code: string, message: string) {
  return Response.json({ accepted: false, code, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isDemoRequestOrigin(request.headers.get("origin"), request.url, process.env.NODE_ENV === "development")) return reply(403, "ORIGIN_NOT_ALLOWED", "Open the demo page and try again. No call was placed.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415, "INVALID_CONTENT_TYPE", "Use the demo form. No call was placed.");
  if (Number(request.headers.get("content-length")) > 8192) return reply(413, "PAYLOAD_TOO_LARGE", "Your request is too large. No call was placed.");

  let lead;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8192) return reply(413, "PAYLOAD_TOO_LARGE", "Your request is too large. No call was placed.");
    lead = validateTestAiCallLead(JSON.parse(raw));
  } catch (cause) {
    return reply(400, "INVALID_CALL_DETAILS", cause instanceof Error ? cause.message : "Check your call details and try again.");
  }

  const publicMode = process.env.TEST_AI_CALL_MODE === "public";
  if (!publicMode && !isApprovedDemoRecipient(lead.phone, process.env.TEST_AI_CALL_PHONE)) return reply(403, "RECIPIENT_NOT_ALLOWED", "Call testing is currently restricted to the approved test mobile. No call was placed.");
  if (publicMode) {
    if (process.env.TEST_AI_CALL_ISOLATION !== publicIsolation) return reply(503, "CALL_ISOLATION_NOT_VERIFIED", "The public call demo is not enabled yet. No call was placed.");
    if (protectedNumbers.has(lead.phone) || lead.phone === process.env.RETELL_DEMO_FROM_NUMBER) return reply(403, "PROTECTED_RECIPIENT", "This number is excluded from the demo. Use your own mobile. No call was placed.");
    try {
      if ((await checkBotId({ advancedOptions: { checkLevel: "basic" } })).isBot) return reply(403, "BROWSER_CHECK_FAILED", "The browser check failed. Open the demo page in your browser. No call was placed.");
    } catch {
      return reply(503, "BROWSER_CHECK_UNAVAILABLE", "The browser check is unavailable. Try again later. No call was placed.");
    }
  }

  const apiKey = process.env.RETELL_API_KEY;
  const fromNumber = process.env.RETELL_DEMO_FROM_NUMBER;
  if (!apiKey || !fromNumber) return reply(503, "CALL_CONNECTION_MISSING", "The AI call demo is temporarily unavailable. No call was placed.");

  const requestId = randomUUID();
  const currentTime = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Brisbane" }).format(new Date());
  const body = buildRetellDemoCallBody(lead, {
    fromNumber, agentId: process.env.RETELL_DEMO_AGENT_ID, requestId, currentTime,
  });

  try {
    const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(12_000), cache: "no-store", redirect: "error",
    });
    if (!response.ok) {
      console.warn("test_ai_call_rejected", { requestId, status: response.status });
      if (response.status === 400) return reply(400, "CALL_REJECTED", "The number could not be called. Check it and try again.");
      if (response.status === 409) return reply(409, "CALL_NOT_READY", "The phone line is not ready yet. Please wait a moment before trying again.");
      if (response.status === 429) return reply(429, "CALL_LIMIT_REACHED", "The call demo is busy. Please try again in a few minutes.");
      return reply(502, "CALL_PROVIDER_REJECTED", "The AI call could not be started. No automatic retry was attempted.");
    }
    const value = await response.json() as { call_id?: unknown };
    if (typeof value.call_id !== "string") return reply(502, "CALL_UNCONFIRMED", "We could not confirm whether the call started. Check your phone before trying again.");
    console.info("test_ai_call_accepted", { requestId, callId: value.call_id });
    return Response.json({ accepted: true, code: "CALL_ACCEPTED", message: "Your AI call is starting now. Keep your phone nearby—it should ring shortly." }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return reply(502, "CALL_OUTCOME_UNKNOWN", "We could not confirm whether the call started. Check your phone before trying again; no automatic retry was attempted.");
  }
}
