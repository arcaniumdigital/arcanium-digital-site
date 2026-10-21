import { describe, expect, it, vi } from "vitest";
import { demoDeliveryTarget as target, startOwnerSmsDemo } from "../../lib/seller-demo-delivery";
import type { DemoSmsLead } from "../../lib/seller-demo-sms";

const lead: DemoSmsLead = { name: "Sam Example", phone: "+61412345678", address: "1 Example Street", suburb: "Kellyville", scenario: "curious", smsConsent: true };
const config = { token: "synthetic-private-token", approvedPhone: lead.phone, isolationVerified: "owner-only-workflow-v1" };
const contact = { id: target.contactId, locationId: target.locationId, phone: lead.phone };
const workflow = { id: target.workflowId, locationId: target.locationId, name: target.workflowName, status: "published" };
function fakeTransport(responses: unknown[]) {
  return vi.fn(async () => {
    const value = responses.shift();
    if (value instanceof Error) throw value;
    return Response.json(value);
  }) as unknown as ReturnType<typeof vi.fn<typeof fetch>>;
}
describe("fixed owner-only native GHL delivery", () => {
  it("makes no provider requests for another number, missing credential or missing isolation proof", async () => {
    const network = fakeTransport([]);
    expect((await startOwnerSmsDemo({ ...lead, phone: "+61400000000" }, config, network)).status).toBe(403);
    expect((await startOwnerSmsDemo(lead, { ...config, token: undefined }, network)).code).toBe("DEMO_CONNECTION_MISSING");
    expect((await startOwnerSmsDemo(lead, { ...config, isolationVerified: undefined }, network)).code).toBe("DEMO_ISOLATION_NOT_VERIFIED");
    expect(network).not.toHaveBeenCalled();
  });
  it.each([{ ...contact, phone: "+61400000000" }, { ...contact, locationId: "another-location" }, { ...contact, id: "another-contact" }])("rejects a mismatched persisted contact", async wrong => {
    const network = fakeTransport([{ contact: wrong }]);
    expect((await startOwnerSmsDemo(lead, config, network)).code).toBe("DEMO_CONTACT_MISMATCH");
    expect(network).toHaveBeenCalledTimes(1);
  });
  it.each([{ ...contact, assignedTo: "staff" }, { ...contact, followers: ["staff"] }])("blocks a staff-associated test contact", async unsafe => {
    const network = fakeTransport([{ contact: unsafe }]);
    expect((await startOwnerSmsDemo(lead, config, network)).code).toBe("DEMO_CONTACT_NOT_ISOLATED");
    expect(network).toHaveBeenCalledTimes(1);
  });
  it.each([{ ...contact, dnd: true }, { ...contact, dndSettings: { SMS: { status: "active" } } }, { ...contact, inboundDndSettings: { all: { status: "active" } } }])("preserves SMS opt-outs", async restricted => {
    const network = fakeTransport([{ contact: restricted }]);
    expect((await startOwnerSmsDemo(lead, config, network)).code).toBe("DEMO_SMS_OPTED_OUT");
    expect(network).toHaveBeenCalledTimes(1);
  });
  it.each([{ ...workflow, status: "draft" }, { ...workflow, name: "Production leads" }, { ...workflow, locationId: "another-location" }])("blocks a draft or changed workflow", async changed => {
    const network = fakeTransport([{ contact }, { workflows: [changed] }]);
    expect((await startOwnerSmsDemo(lead, config, network)).code).toBe("DEMO_WORKFLOW_NOT_READY");
    expect(network).toHaveBeenCalledTimes(2);
  });
  it("updates only fictional details on the fixed contact and accepts enrolment, not SMS delivery", async () => {
    const network = fakeTransport([{ contact }, { workflows: [workflow] }, { contact }, { succeeded: true }]);
    const result = await startOwnerSmsDemo(lead, config, network);
    expect(result).toMatchObject({ status: 202, accepted: true, state: "PENDING" });
    const calls = network.mock.calls;
    expect(calls.map(c => String(c[0]))).toEqual([
      `https://services.leadconnectorhq.com/contacts/${target.contactId}`,
      `https://services.leadconnectorhq.com/workflows/?locationId=${target.locationId}`,
      `https://services.leadconnectorhq.com/contacts/${target.contactId}`,
      `https://services.leadconnectorhq.com/contacts/${target.contactId}/workflow/${target.workflowId}`,
    ]);
    const payload = JSON.parse(String(calls[2][1]?.body));
    expect(payload).toEqual({ name: lead.name, address1: lead.address, city: lead.suburb, source: "Just curious" });
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("dnd");
    expect(JSON.parse(String(calls[3][1]?.body)).eventStartTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
    expect(result.message).toContain("delivery is not confirmed");
  });
  it("does not enrol if the saved update has a different phone", async () => {
    const network = fakeTransport([{ contact }, { workflows: [workflow] }, { contact: { ...contact, phone: "+61400000000" } }]);
    expect((await startOwnerSmsDemo(lead, config, network)).code).toBe("DEMO_UPDATE_NOT_VERIFIED");
    expect(network).toHaveBeenCalledTimes(3);
  });
  it("does not retry or claim no SMS on an uncertain enrolment", async () => {
    const network = fakeTransport([{ contact }, { workflows: [workflow] }, { contact }, new Error("timeout")]);
    expect(await startOwnerSmsDemo(lead, config, network)).toMatchObject({ state: "UNKNOWN", code: "DEMO_ENROLMENT_UNCONFIRMED" });
    expect(network).toHaveBeenCalledTimes(4);
  });
  it("does not treat a false or malformed enrolment result as delivery", async () => {
    const network = fakeTransport([{ contact }, { workflows: [workflow] }, { contact }, { succeeded: false }]);
    expect((await startOwnerSmsDemo(lead, config, network)).state).toBe("UNKNOWN");
  });
});
