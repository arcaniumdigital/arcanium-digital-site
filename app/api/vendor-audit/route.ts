import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { bookingTokenCookieName } from "@/lib/booking-tracking";
import {
  buildCloudflareIngressPayload,
  buildMakeWebhookPayload,
  hmacSha256Hex,
  isCloudflareMode,
} from "@/lib/vendor-audit-intake.mjs";

const webhookAttempts = 3;
const webhookTimeoutMs = 8_000;

export const runtime = "nodejs";

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function configuredMode() {
  return process.env.LEAD_INGRESS_MODE === "cloudflare" ? "cloudflare" : "make";
}

function safeRequestId(request: Request) {
  return request.headers.get("x-vercel-id") || crypto.randomUUID();
}

async function sendCloudflareIngress(payload: Record<string, unknown>) {
  const ingressSecret = process.env.LIVE_NURTURE_INGRESS_HMAC_SECRET;
  const ingressUrl = process.env.LIVE_NURTURE_INGRESS_URL;
  if (!ingressSecret || !ingressUrl) {
    return { ok: false as const, status: 503, reason: "ingress_not_configured" };
  }

  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  const rawBody = JSON.stringify(payload);
  const signature = hmacSha256Hex(ingressSecret, `${timestamp}.${nonce}.${rawBody}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), webhookTimeoutMs);

  try {
    const response = await fetch(ingressUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-live-nurture-timestamp": timestamp,
        "x-live-nurture-nonce": nonce,
        "x-live-nurture-signature": `sha256=${signature}`,
      },
      body: rawBody,
      cache: "no-store",
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status, reason: response.ok ? "accepted" : "worker_rejected" };
  } catch {
    return { ok: false as const, status: 502, reason: "worker_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = safeRequestId(request);
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (
    fullName.length < 2 ||
    fullName.length > 120 ||
    phone.replace(/\D/g, "").length < 8 ||
    phone.length > 30
  ) {
    return NextResponse.json(
      { message: "Please complete all fields with valid details." },
      { status: 400 }
    );
  }

  const bookingToken = randomBytes(12).toString("hex");
  const submittedAt = new Date().toISOString();
  const mode = configuredMode();
  const leadRef = bookingToken.slice(0, 8);

  console.log(
    JSON.stringify({
      level: "info",
      message: "Vendor audit lead delivery started",
      route: "/api/vendor-audit",
      requestId,
      leadRef,
      mode,
    })
  );

  if (isCloudflareMode(mode)) {
    const ingress = buildCloudflareIngressPayload(body, {
      fullName,
      phone,
      bookingToken,
      submittedAt,
    });
    if (!ingress.ok || !ingress.payload) {
      return NextResponse.json(
        { message: "Please provide a valid email, mobile consent and timezone." },
        { status: 400 }
      );
    }

    const delivery = await sendCloudflareIngress(ingress.payload);
    if (!delivery.ok) {
      console.error(JSON.stringify({ level: "error", message: "Vendor audit trusted ingress failed", route: "/api/vendor-audit", requestId, leadRef, mode, status: delivery.status, reason: delivery.reason, durationMs: Date.now() - startedAt }));
      return NextResponse.json(
        { message: "We couldnâ€™t safely submit your audit request. Please try again." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({ ok: true, bookingToken });
    response.cookies.set({ name: bookingTokenCookieName, value: bookingToken, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return response;
  }

  const leadWebhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!leadWebhookUrl) {
    return NextResponse.json(
      { message: "Lead delivery is not configured yet. Please contact us directly." },
      { status: 503 }
    );
  }

  // The Make branch deliberately keeps the recovered production wire payload
  // byte-for-byte compatible in field shape. Cloudflare is opt-in only.
  const webhookPayload = buildMakeWebhookPayload({ fullName, phone, bookingToken, submittedAt });

  let lastStatus = 0;
  let lastError = "";

  for (let attempt = 1; attempt <= webhookAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhookTimeoutMs);

    try {
      const webhookResponse = await fetch(leadWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
        cache: "no-store",
        signal: controller.signal,
      });

      lastStatus = webhookResponse.status;

      if (webhookResponse.ok) {
        console.log(
          JSON.stringify({
            level: "info",
            message: "Vendor audit lead accepted",
            route: "/api/vendor-audit",
            requestId,
            leadRef,
            mode,
            attempt,
            durationMs: Date.now() - startedAt,
          })
        );

        const response = NextResponse.json({ ok: true, bookingToken });

        response.cookies.set({
          name: bookingTokenCookieName,
          value: bookingToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

        return response;
      }

      lastError = `Webhook returned ${webhookResponse.status}`;

      if (webhookResponse.status < 500 && webhookResponse.status !== 429) {
        break;
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Unknown webhook error";
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < webhookAttempts) {
      await wait(attempt * 300);
    }
  }

  console.error(
    JSON.stringify({
      level: "error",
      message: "Vendor audit lead delivery failed",
      route: "/api/vendor-audit",
      requestId,
      leadRef,
      mode,
      attempts: webhookAttempts,
      lastStatus,
      error: lastError,
      durationMs: Date.now() - startedAt,
    })
  );

  return NextResponse.json(
    { message: "We couldn’t safely submit your audit request. Please try again." },
    { status: 502 }
  );
}
