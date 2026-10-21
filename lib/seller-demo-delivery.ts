import { isApprovedDemoRecipient, type DemoSmsLead } from "./seller-demo-sms";

// This adapter is deliberately bound to the existing owner test contact and
// test-only workflow. Neither a request nor an environment override can select
// another contact, client, workflow or sender. GHL owns the SMS and reply path.
export const demoDeliveryTarget = {
  locationId: "LU1MdM6qvfyitoP94OZe",
  contactId: "LXBhIeoKbR3lgef6VdpM",
  workflowId: "04145671-de22-4673-b409-f7a25d17cf1d",
  workflowName: "ARC | TEST ONLY — Seller Form to AI SMS",
} as const;

type Settings = { token?: string; approvedPhone?: string; isolationVerified?: string };
type Result = { status: number; accepted: boolean; state: "BLOCKED" | "PENDING" | "UNKNOWN"; code: string; message: string };
const blocked = (code: string, message: string, status = 503): Result => ({ status, accepted: false, state: "BLOCKED", code, message });
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

export async function startOwnerSmsDemo(lead: DemoSmsLead, settings: Settings, transport: typeof fetch = fetch): Promise<Result> {
  if (!isApprovedDemoRecipient(lead.phone, settings.approvedPhone)) return blocked("RECIPIENT_NOT_ALLOWED", "SMS testing is restricted to the owner's approved mobile. No SMS was sent.", 403);
  if (!settings.token) return blocked("DEMO_CONNECTION_MISSING", "The private demo connection is not configured. No SMS was sent.");
  if (settings.isolationVerified !== "owner-only-workflow-v1") return blocked("DEMO_ISOLATION_NOT_VERIFIED", "The SMS demo is not enabled yet. Recipient and notification checks must pass first. No SMS was sent.");
  const headers = { Authorization: `Bearer ${settings.token}`, Version: "2021-07-28", "Content-Type": "application/json" };
  async function request(path: string, method = "GET", body?: unknown) {
    const response = await transport(`https://services.leadconnectorhq.com${path}`, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(5_000), cache: "no-store", redirect: "error",
    });
    if (!response.ok) {
      const error = object(await response.json().catch(() => null));
      const detail = JSON.stringify(error?.message ?? error?.error ?? "").slice(0, 400).replaceAll(settings.token!, "[credential]").replaceAll(lead.phone, "[test-phone]");
      console.warn("seller_demo_provider_rejected", { method, status: response.status, operation: path.includes('/workflow/') ? 'enrol' : method === 'PUT' ? 'update-test-contact' : 'verify', detail });
      throw new Error("GHL_REQUEST_REJECTED");
    }
    const value = object(await response.json());
    if (method === "POST") console.info("seller_demo_enrolment_receipt", { status: response.status, keys: Object.keys(value ?? {}), succeeded: value?.succeeded, succeded: value?.succeded });
    return value;
  }
  let contact: Record<string, unknown> | null;
  try {
    contact = object((await request(`/contacts/${demoDeliveryTarget.contactId}`))?.contact);
    if (!contact || contact.id !== demoDeliveryTarget.contactId || contact.locationId !== demoDeliveryTarget.locationId
      || typeof contact.phone !== "string" || !isApprovedDemoRecipient(contact.phone, settings.approvedPhone)) {
      return blocked("DEMO_CONTACT_MISMATCH", "The saved test contact does not match the approved destination. No SMS was sent.");
    }
    if (contact.assignedTo || (Array.isArray(contact.followers) && contact.followers.length)) {
      return blocked("DEMO_CONTACT_NOT_ISOLATED", "The test contact has a staff assignment or follower. No SMS was sent.");
    }
    const sms = object(object(contact.dndSettings)?.SMS);
    const inbound = object(object(contact.inboundDndSettings)?.all);
    if (contact.dnd === true || sms?.status === "active" || inbound?.status === "active") {
      return blocked("DEMO_SMS_OPTED_OUT", "SMS is restricted for this test contact. No SMS was sent and no opt-out was changed.", 409);
    }
    const workflows = (await request(`/workflows/?locationId=${demoDeliveryTarget.locationId}`))?.workflows;
    const workflow = Array.isArray(workflows) ? workflows.map(object).find(w => w?.id === demoDeliveryTarget.workflowId) : null;
    if (!workflow || workflow.name !== demoDeliveryTarget.workflowName || workflow.locationId !== demoDeliveryTarget.locationId || workflow.status !== "published") {
      return blocked("DEMO_WORKFLOW_NOT_READY", "The isolated SMS workflow is not ready. No SMS was sent.");
    }
    // Update the fixed owner fixture only. Never create a contact, alter phone,
    // email, assignment, consent or DND, or enrol a production intake workflow.
    const updated = object((await request(`/contacts/${demoDeliveryTarget.contactId}`, "PUT", {
      name: lead.name, address1: lead.address, city: lead.suburb,
      source: lead.scenario === "curious" ? "Just curious" : "Thinking of selling",
    }))?.contact);
    if (!updated || updated.id !== demoDeliveryTarget.contactId || updated.locationId !== demoDeliveryTarget.locationId
      || typeof updated.phone !== "string" || !isApprovedDemoRecipient(updated.phone, settings.approvedPhone)) {
      return blocked("DEMO_UPDATE_NOT_VERIFIED", "The test details could not be verified. No SMS workflow was started.");
    }
  } catch {
    return blocked("DEMO_PROVIDER_CHECK_FAILED", "The private demo checks could not complete. No SMS workflow was started.");
  }
  // GHL's existing workflow is configured to disallow simultaneous enrolment
  // and holds the contact for 24 hours after its one opening SMS. That native
  // persisted run is the duplicate-send/rate-limit authority, not process RAM.
  // Never retry this effect on a timeout or ambiguous response.
  try {
    // GHL rejects standard ISO UTC Z/millisecond timestamps with HTTP 422.
    // Match its documented explicit-offset format, proved by the live error.
    const eventStartTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
    const result = await request(`/contacts/${demoDeliveryTarget.contactId}/workflow/${demoDeliveryTarget.workflowId}`, "POST", { eventStartTime });
    if (result?.succeeded === true || result?.succeded === true) {
      return { status: 202, accepted: true, state: "PENDING", code: "DEMO_ENROLMENT_ACCEPTED", message: "Your test enquiry was accepted. Check your phone; SMS delivery is not confirmed yet. An active demo will not send another opening message." };
    }
  } catch { /* The native workflow may have accepted the request. Never resend. */ }
  return { status: 502, accepted: false, state: "UNKNOWN", code: "DEMO_ENROLMENT_UNCONFIRMED", message: "We could not confirm whether the demo started. Check your phone before trying again. No automatic resend was attempted." };
}
