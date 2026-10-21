import { demoDeliveryTarget } from "./seller-demo-delivery";
import { validateDemoSmsLead, type DemoSmsLead } from "./seller-demo-sms";

export const publicDemoTag = "arc-seller-demo";
export const publicDemoIsolation = "consenting-demo-v1";
// Public business numbers: never use the demonstration to contact Kael or loop
// its own sender. Existing real CRM contacts are separately protected below.
const protectedNumbers = new Set(["+61435821736", "+61485064804"]);
type Settings = { token?: string; isolationVerified?: string };
type Result = { status: number; accepted: boolean; state: "BLOCKED" | "PENDING" | "UNKNOWN"; code: string; message: string };
const object = (v: unknown): Record<string, unknown> | null => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;
const blocked = (code: string, message: string, status = 503): Result => ({ status, accepted: false, state: "BLOCKED", code, message });

export async function startPublicSmsDemo(input: DemoSmsLead, settings: Settings, requestId: string, transport: typeof fetch = fetch): Promise<Result> {
  const lead = validateDemoSmsLead(input); // The exported service is safe outside its HTTP handler too.
  if (protectedNumbers.has(lead.phone)) return blocked("PROTECTED_RECIPIENT", "This number is excluded from the demo. Use your own mobile. No SMS was sent.", 403);
  if (!settings.token) return blocked("DEMO_CONNECTION_MISSING", "The demo connection is unavailable. No SMS was sent.");
  if (settings.isolationVerified !== publicDemoIsolation) return blocked("DEMO_ISOLATION_NOT_VERIFIED", "The multi-number demo is not enabled yet. No SMS was sent.");
  const headers = { Authorization: `Bearer ${settings.token}`, Version: "2021-07-28", "Content-Type": "application/json" };
  async function request(path: string, method = "GET", body?: unknown) {
    const response = await transport(`https://services.leadconnectorhq.com${path}`, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(5_000), cache: "no-store", redirect: "error",
    });
    if (!response.ok) {
      // Do not log provider bodies, submitted details, credentials or phone numbers.
      console.warn("seller_demo_provider_rejected", { requestId, method, status: response.status });
      throw new Error("DEMO_PROVIDER_REJECTED");
    }
    return object(await response.json());
  }
  function eligible(contact: Record<string, unknown> | null) {
    if (!contact || typeof contact.id !== "string" || !/^[A-Za-z0-9_-]+$/.test(contact.id)
      || contact.locationId !== demoDeliveryTarget.locationId || contact.phone !== lead.phone) return false;
    const tags = contact.tags;
    return Array.isArray(tags) && tags.includes(publicDemoTag)
      && tags.every(t => t === publicDemoTag || t === "arc-test")
      && !contact.assignedTo && !contact.email
      && (!Array.isArray(contact.followers) || contact.followers.length === 0);
  }
  function optedOut(contact: Record<string, unknown>) {
    return contact.dnd === true || object(object(contact.dndSettings)?.SMS)?.status === "active"
      || object(object(contact.inboundDndSettings)?.all)?.status === "active";
  }
  let contactId: string;
  try {
    // Verify the one selected native workflow before creating any CRM record.
    const workflows = (await request(`/workflows/?locationId=${demoDeliveryTarget.locationId}`))?.workflows;
    const workflow = Array.isArray(workflows) ? workflows.map(object).find(w => w?.id === demoDeliveryTarget.workflowId) : null;
    if (!workflow || workflow.name !== demoDeliveryTarget.workflowName || workflow.locationId !== demoDeliveryTarget.locationId || workflow.status !== "published") {
      return blocked("DEMO_WORKFLOW_NOT_READY", "The demonstration is temporarily unavailable. No SMS was sent.");
    }
    const lookup = await request(`/contacts/search/duplicate?locationId=${demoDeliveryTarget.locationId}&number=${encodeURIComponent(lead.phone)}`);
    if (!lookup || !("contact" in lookup)) return blocked("DEMO_LOOKUP_UNCONFIRMED", "The mobile could not be checked safely. No SMS was sent.");
    let contact = object(lookup.contact);
    if (contact) {
      if (!eligible(contact)) return blocked("EXISTING_CONTACT_PROTECTED", "This mobile belongs to an existing non-demo contact. Its settings have not been changed. Use the website chat instead.", 409);
      if (optedOut(contact)) return blocked("DEMO_SMS_OPTED_OUT", "SMS is opted out for this mobile. No messages or opt-out settings were changed.", 409);
      // Keep the saved scenario stable during an active conversation. A repeat
      // request cannot overwrite a real lead, its consent or its conversation.
    } else {
      const created = await request("/contacts/", "POST", {
        locationId: demoDeliveryTarget.locationId, name: lead.name, phone: lead.phone,
        address1: lead.address, city: lead.suburb, country: "AU",
        source: lead.scenario === "curious" ? "Just curious" : "Thinking of selling",
        tags: [publicDemoTag, "arc-test"],
      });
      contact = object(created?.contact);
      if (!eligible(contact)) return blocked("DEMO_CONTACT_NOT_ISOLATED", "The demo contact could not be verified. No SMS workflow was started.");
      if (optedOut(contact!)) return blocked("DEMO_SMS_OPTED_OUT", "SMS is restricted for this mobile. No opt-out settings were changed.", 409);
    }
    contactId = contact!.id as string;
    // Consent evidence is persisted before the send, on the isolated contact.
    const receipt = await request(`/contacts/${contactId}/notes`, "POST", {
      body: `Arcanium seller SMS demonstration requested. Consent version 2026-10-21: visitor explicitly requested a demonstration SMS conversation on their own mobile; not unrelated marketing. Captured ${new Date().toISOString()}. Request ${requestId}. No real booking, email, staff handoff or client notification is authorised.`,
    });
    if (!object(receipt?.note)?.id) return blocked("DEMO_CONSENT_NOT_RECORDED", "The demo request could not be recorded. No SMS workflow was started.");
  } catch {
    // A contact may exist after an uncertain create, but no send is attempted.
    return blocked("DEMO_PROVIDER_CHECK_FAILED", "The demo checks could not complete. No SMS workflow was started.");
  }
  try {
    const eventStartTime = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
    const receipt = await request(`/contacts/${contactId}/workflow/${demoDeliveryTarget.workflowId}`, "POST", { eventStartTime });
    if (receipt?.succeeded === true || receipt?.succeded === true) return {
      status: 202, accepted: true, state: "PENDING", code: "DEMO_ENROLMENT_ACCEPTED",
      message: "Your demo request was accepted. Check your SMS messages and reply there to continue. Delivery is not confirmed yet. An active demo will not send another opening message within 24 hours.",
    };
  } catch { /* The effect may have started. Never automatically retry. */ }
  return { status: 502, accepted: false, state: "UNKNOWN", code: "DEMO_ENROLMENT_UNCONFIRMED", message: "We could not confirm whether the demo started. Check your phone before trying again; no automatic resend was attempted." };
}
