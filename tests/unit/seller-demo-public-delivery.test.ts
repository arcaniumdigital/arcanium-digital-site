import { describe, expect, it, vi } from "vitest";
import { startPublicSmsDemo, publicDemoIsolation, publicDemoTag } from "../../lib/seller-demo-public-delivery";
import { demoDeliveryTarget as target } from "../../lib/seller-demo-delivery";
import type { DemoSmsLead } from "../../lib/seller-demo-sms";

const lead: DemoSmsLead = { name: "Taylor Example", phone: "+61412345678", address: "1 Example Street", suburb: "Kellyville", scenario: "selling", smsConsent: true };
const config = { token: "synthetic", isolationVerified: publicDemoIsolation };
const contact = { id: "demoContact", locationId: target.locationId, phone: lead.phone, tags: [publicDemoTag, "arc-test"] };
const ready = { workflows: [{ id: target.workflowId, locationId: target.locationId, name: target.workflowName, status: "published" }] };
const note = { note: { id: "consentReceipt" } };
function network(values: unknown[]) {
  return vi.fn(async () => {
    const next = values.shift();
    if (next instanceof Error) throw next;
    return Response.json(next);
  }) as unknown as ReturnType<typeof vi.fn<typeof fetch>>;
}
describe("consenting public SMS demo isolation", () => {
  it("requires consent even if called outside the route", async () => {
    const fetcher = network([]);
    await expect(startPublicSmsDemo({ ...lead, smsConsent: false } as unknown as DemoSmsLead, config, "request", fetcher)).rejects.toThrow("Confirm");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["+61435821736", "+61485064804"])("never contacts a protected business number %s", async phone => {
    const fetcher = network([]);
    expect((await startPublicSmsDemo({ ...lead, phone }, config, "request", fetcher)).code).toBe("PROTECTED_RECIPIENT");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requires the explicit multi-number release gate and credential", async () => {
    const fetcher = network([]);
    expect((await startPublicSmsDemo(lead, {}, "request", fetcher)).code).toBe("DEMO_CONNECTION_MISSING");
    expect((await startPublicSmsDemo(lead, { token: "synthetic", isolationVerified: "owner-only-workflow-v1" }, "request", fetcher)).code).toBe("DEMO_ISOLATION_NOT_VERIFIED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("checks the published native workflow before writing a contact", async () => {
    const fetcher = network([{ workflows: [] }]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).code).toBe("DEMO_WORKFLOW_NOT_READY");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    { ...contact, tags: [] }, { ...contact, assignedTo: "agent" }, { ...contact, followers: ["agent"] },
    { ...contact, email: "lead@example.com" }, { ...contact, tags: [publicDemoTag, "arc-seller-lead"] },
    { ...contact, locationId: "other" }, { ...contact, phone: "+61400000000" }, { ...contact, id: "../other" },
  ])("does not overwrite or enrol existing non-demo/staff-associated contacts", async existing => {
    const fetcher = network([ready, { contact: existing }]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).code).toBe("EXISTING_CONTACT_PROTECTED");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it.each([{ dnd: true }, { dndSettings: { SMS: { status: "active" } } }, { inboundDndSettings: { all: { status: "active" } } }])("preserves all native opt-out cases", async optOut => {
    const fetcher = network([ready, { contact: { ...contact, ...optOut } }]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).code).toBe("DEMO_SMS_OPTED_OUT");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("fails closed on an unconfirmed duplicate lookup", async () => {
    const fetcher = network([ready, {}]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).code).toBe("DEMO_LOOKUP_UNCONFIRMED");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("creates a separate unassigned demo contact at the submitted phone, records consent, then enrols only that contact", async () => {
    const fetcher = network([ready, { contact: null }, { contact }, note, { succeded: true }]);
    const result = await startPublicSmsDemo(lead, config, "request", fetcher);
    expect(result).toMatchObject({ status: 202, accepted: true, state: "PENDING" });
    const calls = fetcher.mock.calls;
    const creation = JSON.parse(String(calls[2][1]?.body));
    expect(creation).toMatchObject({ phone: lead.phone, name: lead.name, tags: [publicDemoTag, "arc-test"] });
    expect(creation).not.toHaveProperty("email");
    expect(creation).not.toHaveProperty("assignedTo");
    expect(creation).not.toHaveProperty("dnd");
    expect(String(calls[3][0]).endsWith(`/contacts/${contact.id}/notes`)).toBe(true);
    expect(String(calls[3][1]?.body)).toContain("explicitly requested");
    expect(String(calls[4][0]).endsWith(`/contacts/${contact.id}/workflow/${target.workflowId}`)).toBe(true);
    expect(result.message).toContain("Delivery is not confirmed");
  });
  it("never enrols a new contact until its isolation is read back", async () => {
    const fetcher = network([ready, { contact: null }, { contact: { ...contact, assignedTo: "agent" } }]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).code).toBe("DEMO_CONTACT_NOT_ISOLATED");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("reuses only an isolated demo contact without changing fields or clearing DND", async () => {
    const fetcher = network([ready, { contact }, note, { succeeded: true }]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).accepted).toBe(true);
    expect(fetcher.mock.calls.some(c => c[1]?.method === "PUT")).toBe(false);
    expect(fetcher.mock.calls.filter(c => String(c[0]).endsWith("/contacts/"))).toHaveLength(0);
  });
  it("requires a persisted consent receipt before any opening SMS", async () => {
    const fetcher = network([ready, { contact }, {}]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).code).toBe("DEMO_CONSENT_NOT_RECORDED");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("does not automatically retry an ambiguous workflow enrolment", async () => {
    const fetcher = network([ready, { contact }, note, new Error("timeout")]);
    expect((await startPublicSmsDemo(lead, config, "request", fetcher)).state).toBe("UNKNOWN");
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
});
