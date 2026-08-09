import type { LeadRow, MessageJobRow } from "./contracts";

type JsonRecord = Record<string, unknown>;

export class ProviderError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly sideEffectUnknown = false,
  ) {
    super(code);
    this.name = "ProviderError";
  }
}

function record(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = 10_000,
): Promise<{ response: Response; data: unknown }> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const data: unknown = await response.json().catch(() => null);
  return { response, data };
}

function clickSendAuth(username: string, apiKey: string): string {
  return `Basic ${btoa(`${username}:${apiKey}`)}`;
}

export async function clickSendBalance(env: Cloudflare.Env): Promise<number> {
  const { response, data } = await fetchJson("https://rest.clicksend.com/v3/account", {
    headers: { Authorization: clickSendAuth(env.CLICKSEND_USERNAME, env.CLICKSEND_API_KEY) },
  });
  const balance = Number(record(record(data)?.data)?.balance);
  if (!response.ok || !Number.isFinite(balance)) throw new ProviderError("CLICKSEND_ACCOUNT_CHECK_FAILED", response.status >= 500);
  return balance;
}

export async function sendClickSendSms(input: {
  env: Cloudflare.Env;
  lead: LeadRow;
  job: MessageJobRow;
  body: string;
}): Promise<{ messageId: string; status: string; parts: number; price: number | null; currency: string | null }> {
  const { env, lead, job, body } = input;
  const minimumBalance = Number(env.CLICKSEND_MINIMUM_BALANCE_AUD);
  const balance = await clickSendBalance(env);
  if (!Number.isFinite(minimumBalance) || balance < minimumBalance) throw new ProviderError("CLICKSEND_BALANCE_BELOW_RESERVE", false);
  let result: { response: Response; data: unknown };
  try {
    result = await fetchJson("https://rest.clicksend.com/v3/sms/send", {
      method: "POST",
      headers: {
        Authorization: clickSendAuth(env.CLICKSEND_USERNAME, env.CLICKSEND_API_KEY),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shorten_urls: false,
        messages: [{
          source: "arcanium-funnel",
          body,
          to: lead.phone_e164,
          from: env.CLICKSEND_FROM_NUMBER,
          custom_string: job.id,
        }],
      }),
    });
  } catch {
    throw new ProviderError("CLICKSEND_SEND_TIMEOUT", false, true);
  }
  const root = record(result.data);
  const data = record(root?.data);
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  const message = record(messages[0]);
  const messageId = typeof message?.message_id === "string" ? message.message_id : "";
  const status = typeof message?.status === "string" ? message.status : "UNKNOWN";
  if (!result.response.ok || !messageId || !["SUCCESS", "QUEUED"].includes(status)) {
    const retryable = result.response.status >= 500 || result.response.status === 429;
    throw new ProviderError(`CLICKSEND_${status || result.response.status}`, retryable);
  }
  return {
    messageId,
    status,
    parts: Number(message?.message_parts ?? 1),
    price: Number.isFinite(Number(message?.message_price)) ? Number(message?.message_price) : null,
    currency: typeof record(data?._currency)?.currency_name_short === "string" ? String(record(data?._currency)?.currency_name_short) : null,
  };
}

async function brevoRequest(env: Cloudflare.Env, path: string, init: RequestInit): Promise<unknown> {
  const { response, data } = await fetchJson(`https://api.brevo.com/v3${path}`, {
    ...init,
    headers: {
      "api-key": env.BREVO_API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new ProviderError(`BREVO_HTTP_${response.status}`, response.status >= 500 || response.status === 429);
  return data;
}

export async function checkBrevo(env: Cloudflare.Env): Promise<void> {
  await brevoRequest(env, "/account", { method: "GET" });
}

export async function checkCalWebhook(env: Cloudflare.Env): Promise<void> {
  const response = await fetch(`https://api.cal.com/v2/event-types/${encodeURIComponent(env.CAL_EVENT_TYPE_ID)}/webhooks`, {
    headers: {
      Authorization: `Bearer ${env.CAL_API_KEY}`,
      "cal-api-version": env.CAL_API_VERSION,
    },
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json().catch(() => null) as unknown;
  if (!response.ok) throw new ProviderError(`CAL_HTTP_${response.status}`, response.status >= 500 || response.status === 429);
  const root = record(data);
  const collection = Array.isArray(root?.data) ? root.data : [];
  const expected = env.CAL_EXPECTED_WEBHOOK_URL;
  const found = collection.some((item) => {
    const webhook = record(item);
    const url = typeof webhook?.subscriberUrl === "string" ? webhook.subscriberUrl : typeof webhook?.subscriber_url === "string" ? webhook.subscriber_url : "";
    const active = webhook?.active !== false;
    const triggers = Array.isArray(webhook?.triggers) ? webhook.triggers.map(String) : [];
    return url === expected && active && ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"].every((trigger) => triggers.includes(trigger));
  });
  if (!found) throw new ProviderError("CAL_WEBHOOK_CONFIGURATION_MISSING", false);
}

export async function syncBrevoLead(env: Cloudflare.Env, lead: LeadRow): Promise<{ contactId: string; dealId: string }> {
  const contactResponse = record(await brevoRequest(env, "/contacts", {
    method: "POST",
    body: JSON.stringify({
      ext_id: lead.public_id,
      email: lead.email ?? undefined,
      attributes: {
        FNAME: lead.first_name,
        SMS: lead.phone_e164,
        D1_LEAD_ID: lead.public_id,
        LEAD_SOURCE: "Vendor Conversion Audit",
        SOURCE_PAGE: lead.source_page,
        UTM_SOURCE: lead.utm_source ?? undefined,
        UTM_MEDIUM: lead.utm_medium ?? undefined,
        UTM_CAMPAIGN: lead.utm_campaign ?? undefined,
        UTM_TERM: lead.utm_term ?? undefined,
        UTM_CONTENT: lead.utm_content ?? undefined,
        FIRST_ENQUIRY_AT: lead.created_at,
        MARKETING_SMS_CONSENT: Boolean(lead.marketing_sms_consent),
        CONSENT_VERSION: lead.consent_version,
        BOOKING_STATE: lead.booking_state,
      },
      updateEnabled: true,
      getId: true,
    }),
  }));
  const contactId = String(contactResponse?.id ?? lead.brevo_contact_id ?? "");
  if (!contactId) throw new ProviderError("BREVO_CONTACT_ID_MISSING", false);
  if (lead.brevo_deal_id) return { contactId, dealId: lead.brevo_deal_id };
  const dealResponse = record(await brevoRequest(env, "/crm/deals", {
    method: "POST",
    body: JSON.stringify({
      name: `Vendor Audit - ${lead.public_id}`,
      attributes: {
        pipeline: env.BREVO_PIPELINE_ID,
        deal_stage: env.BREVO_STAGE_NEW_ENQUIRY_ID,
        d1_lead_id: lead.public_id,
      },
      linkedContactsIds: [Number(contactId)],
    }),
  }));
  const dealId = String(dealResponse?.id ?? "");
  if (!dealId) throw new ProviderError("BREVO_DEAL_ID_MISSING", false);
  return { contactId, dealId };
}

export async function updateBrevoBooking(env: Cloudflare.Env, input: {
  contactId: string | null;
  dealId: string | null;
  publicId: string;
  email: string | null;
  bookingState: string;
  bookingUid: string;
  appointmentStart: string;
  appointmentTimezone: string | null;
  stageId: string;
}): Promise<void> {
  if (input.contactId) {
    await brevoRequest(env, `/contacts/${encodeURIComponent(input.publicId)}?identifierType=ext_id`, {
      method: "PUT",
      body: JSON.stringify({
        email: input.email ?? undefined,
        attributes: {
          BOOKING_STATE: input.bookingState,
          CAL_BOOKING_UID: input.bookingUid,
          APPOINTMENT_START: input.appointmentStart,
          APPOINTMENT_TIMEZONE: input.appointmentTimezone ?? "",
        },
      }),
    });
  }
  if (input.dealId) {
    await brevoRequest(env, `/crm/deals/${encodeURIComponent(input.dealId)}`, {
      method: "PATCH",
      body: JSON.stringify({ attributes: { deal_stage: input.stageId } }),
    });
  }
}

export async function sendBrevoInternalEmail(env: Cloudflare.Env, input: {
  templateId: number;
  params: Record<string, string | number | boolean | null>;
  idempotencyKey: string;
}): Promise<string> {
  const response = record(await brevoRequest(env, "/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
      to: [{ email: env.BREVO_OPERATOR_EMAIL, name: env.OPERATOR_NAME }],
      templateId: input.templateId,
      params: input.params,
      headers: { "Idempotency-Key": input.idempotencyKey },
      tags: ["arcanium-vendor-audit"],
    }),
  }));
  return String(response?.messageId ?? "");
}

export async function sendInngestEvent(env: Cloudflare.Env, event: {
  name: string;
  id: string;
  data: Record<string, string | number | boolean | null>;
  ts?: number;
}): Promise<string> {
  const { response, data } = await fetchJson(`https://inn.gs/e/${encodeURIComponent(env.INNGEST_EVENT_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new ProviderError(`INNGEST_HTTP_${response.status}`, response.status >= 500 || response.status === 429);
  return String(record(data)?.ids ?? event.id);
}
