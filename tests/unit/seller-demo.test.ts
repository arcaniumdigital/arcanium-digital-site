import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {buildPracticeEnquiry, demoScenarios, demoSuburbs} from "../../lib/seller-demo";

describe("isolated seller conversation demo", () => {
  it.each(demoScenarios)("builds a clearly labelled $id enquiry without a live destination", scenario => {
    const message = buildPracticeEnquiry("Sam", demoSuburbs[0], scenario.id);
    expect(message).toContain("Demo enquiry only");
    expect(message).toContain(scenario.enquiry);
    expect(message).toContain("don't contact anyone or create a real booking");
    expect(message).not.toMatch(/https?:|\+61|@/);
  });
  it.each(["0400000000", "person@example.com", "<script>bad</script>", "", "A".repeat(31)])("rejects contact details or invalid practice name %s", name => {
    expect(() => buildPracticeEnquiry(name, "Castle Hill", "curious")).toThrow();
  });
  it("allows names with letters, spaces, apostrophes and hyphens", () => {
    expect(buildPracticeEnquiry("  Sam-Jane  ", "Castle Hill", "curious")).toContain("I'm Sam-Jane.");
  });
  it("rejects forged scenarios and a real address in place of an example suburb", () => {
    expect(() => buildPracticeEnquiry("Sam", "1 Real Street", "curious")).toThrow();
    expect(() => buildPracticeEnquiry("Sam", "Castle Hill", "send-sms")).toThrow();
  });
  it("uses the dedicated widget and keeps production lead APIs and tracking out of demo code", () => {
    const client = readFileSync("components/seller-demo/seller-demo.tsx", "utf8");
    const widget = readFileSync("public/seller-demo/chat.html", "utf8");
    expect(widget).toContain('data-widget-id="6ad816ee811edfc81fe0607b"');
    expect(widget).not.toMatch(/LU1MdM6qvfyitoP94OZe|fbq|clarity|SMS|sendgrid|clicksend/i);
    expect(client).not.toMatch(/fetch\(|\/api\/vendor-audit|arc-seller-lead|localStorage|sessionStorage|track\(/);
    expect(client).toContain("event.preventDefault()");
    expect(client).toContain('src="/seller-demo/chat.html"');
    expect(client).toContain("Chat history is retained");
    expect(client).not.toContain("End the chat");
    expect(client).toContain("useSyncExternalStore");
    expect(client).toContain("disabled={!interactive}");
    expect(client).toContain("Enable JavaScript to try the demo");
  });
  it("keeps the demonstration out of indexing and conversion events", () => {
    const page = readFileSync("app/seller-demo/page.tsx", "utf8");
    expect(page).toContain("index: false");
    expect(page).toContain("follow: false");
    expect(page).toContain("does not test production lead delivery");
  });
  it("keeps demo actions disabled in the prompt and explains scenario changes honestly", () => {
    const prompt = readFileSync("demo/seller-assistant-prompt.txt", "utf8");
    expect(prompt).toContain("You have NO actions");
    expect(prompt).toContain("ALREADY introduced");
    expect(prompt).toContain("starts a NEW fictional scenario");
    expect(prompt).toContain("Do not claim earlier GHL chat history was erased");
    expect(prompt).toContain("No real appointment has been booked");
  });
});
